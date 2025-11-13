pipeline {
    agent any

    options {
        // avoid declarative implicit checkout which can cause parse/commit mismatch
        skipDefaultCheckout(true)
        timestamps()
    }

    environment {
        CREDENTIALS_ID = "harbor-creds"
        // Optionally set defaults here in job config if you want:
        // REGISTRY_URL = "http://172.18.10.124"
        // PROJECT = "nkp-sizer"
        // IMAGE_NAME = "app"
    }

    stages {
        stage('Checkout') {
            steps {
                // single explicit checkout
                checkout scm

                script {
                    // --- safe git metadata ---
                    env.GIT_COMMIT = sh(returnStdout: true, script: 'git rev-parse --verify HEAD').trim()
                    if (!env.GIT_COMMIT) {
                        error "Unable to determine git commit"
                    }
                    env.GIT_SHA = env.GIT_COMMIT.take(7)

                    // determine branch for single-branch and multibranch jobs
                    if (!env.BRANCH_NAME || env.BRANCH_NAME.trim() == '') {
                        def rawBranch = sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
                        env.BRANCH_NAME = (rawBranch && rawBranch != 'HEAD') ? rawBranch : 'Production'
                    }

                    echo "Checked out ${env.GIT_COMMIT} on branch ${env.BRANCH_NAME}"
                }
            }
        }

        stage('Prepare') {
            steps {
                script {
                    // --- validate required settings ---
                    def missing = []
                    if (!env.REGISTRY_URL) { missing << 'REGISTRY_URL' }
                    if (!env.PROJECT)     { missing << 'PROJECT' }
                    if (!env.IMAGE_NAME)  { missing << 'IMAGE_NAME' }

                    if (missing) {
                        error "Missing required environment variables: ${missing.join(', ')}. Set them in job or environment."
                    }

                    // Normalize registry host: remove scheme and any trailing slash
                    // Examples:
                    //   "http://172.18.10.124/" -> "172.18.10.124"
                    //   "registry.example.com:5000" -> "registry.example.com:5000"
                    def registryHost = env.REGISTRY_URL.replaceAll('^https?://', '').replaceAll('/+$', '')
                    env.REGISTRY_HOST = registryHost

                    // prepare tag and image names
                    def safeBranch = (env.BRANCH_NAME ?: 'Production').replaceAll('[^A-Za-z0-9._-]', '-')
                    env.IMAGE_TAG = "${safeBranch}-${env.GIT_SHA}"
                    env.FULL_IMAGE = "${env.REGISTRY_HOST}/${env.PROJECT}/${env.IMAGE_NAME}:${env.IMAGE_TAG}"
                    env.FULL_IMAGE_LATEST = "${env.REGISTRY_HOST}/${env.PROJECT}/${env.IMAGE_NAME}:latest"

                    echo "Using registry host: ${env.REGISTRY_HOST}"
                    echo "Image will be: ${env.FULL_IMAGE}"
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh """
                    set -o pipefail
                    echo "Building image: $FULL_IMAGE"
                    docker build \\
                        --pull \\
                        --label ci.build.number=$BUILD_NUMBER \\
                        --label ci.git.branch=$BRANCH_NAME \\
                        --label ci.git.commit=$GIT_COMMIT \\
                        -t $FULL_IMAGE .
                """
            }
        }

        stage('Login to Registry') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: CREDENTIALS_ID,
                    usernameVariable: 'HARBOR_USER',
                    passwordVariable: 'HARBOR_PASS'
                )]) {
                    sh '''
                        set -o pipefail
                        echo "$HARBOR_PASS" | docker login "$REGISTRY_HOST" -u "$HARBOR_USER" --password-stdin
                    '''
                }
            }
        }

        stage('Push Image') {
            steps {
                sh "docker push $FULL_IMAGE"

                script {
                    if ((env.BRANCH_NAME ?: 'Production') == 'Production') {
                        echo "Branch is Production: tagging and pushing :latest"
                        sh """
                            docker tag $FULL_IMAGE $FULL_IMAGE_LATEST
                            docker push $FULL_IMAGE_LATEST
                        """
                    } else {
                        echo "Not Production branch; skipping :latest"
                    }
                }
            }
        }

        stage('Report') {
            steps {
                script {
                    echo "Image pushed: ${env.FULL_IMAGE}"
                    if ((env.BRANCH_NAME ?: 'Production') == 'Production') {
                        echo "Also pushed: ${env.FULL_IMAGE_LATEST}"
                    }
                }
            }
        }
    }

    post {
        always {
            sh """
                set -o pipefail || true
                docker logout ${env.REGISTRY_HOST} || true
                docker image prune -f || true
            """
        }
    }
}
