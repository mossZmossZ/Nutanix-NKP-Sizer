pipeline {
    agent any

    options {
        // Prevent automatic declarative checkout (avoid double-checkout / parsing mismatches)
        skipDefaultCheckout(true)
        timestamps()
    }

    environment {
        CREDENTIALS_ID = "harbor-creds"
    }

    stages {
        stage('Checkout') {
            steps {
                // Perform a single, explicit checkout
                checkout scm

                // Now populate canonical git env vars from the checked-out workspace
                script {
                    // Read full commit hash directly from git to avoid relying on plugin-provided env
                    def commit = sh(returnStdout: true, script: 'git rev-parse --verify HEAD').trim()
                    if (!commit) {
                        // fallback if something went wrong
                        commit = '0000000000000000000000000000000000000000'
                        echo "Warning: git commit could not be determined; using placeholder"
                    }
                    env.GIT_COMMIT = commit
                    env.GIT_SHA = env.GIT_COMMIT.take(7)

                    // BRANCH_NAME available automatically for Multibranch jobs.
                    // For single-branch jobs, derive a branch name; fall back to Production
                    if (!env.BRANCH_NAME || env.BRANCH_NAME.trim() == '') {
                        def rawBranch = sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
                        env.BRANCH_NAME = (rawBranch && rawBranch != 'HEAD') ? rawBranch : 'Production'
                    }

                    // Normalize branch for tags/images
                    def normalized = (env.BRANCH_NAME ?: 'Production').replaceAll('[^A-Za-z0-9._-]', '-')
                    env.IMAGE_TAG = "${normalized}-${env.GIT_SHA}"
                    env.FULL_IMAGE = "${env.REGISTRY_URL}/${env.PROJECT}/${env.IMAGE_NAME}:${env.IMAGE_TAG}"
                    env.FULL_IMAGE_LATEST = "${env.REGISTRY_URL}/${env.PROJECT}/${env.IMAGE_NAME}:latest"

                    echo "Checked out ${env.GIT_COMMIT} on branch ${env.BRANCH_NAME}"
                    echo "IMAGE_TAG = ${env.IMAGE_TAG}"
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh """
                    docker build \
                        --pull \
                        --label ci.build.number=$BUILD_NUMBER \
                        --label ci.git.branch=$BRANCH_NAME \
                        --label ci.git.commit=$GIT_COMMIT \
                        -t $FULL_IMAGE .
                """
            }
        }

        stage('Login to Harbor Registry') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: CREDENTIALS_ID,
                    usernameVariable: 'HARBOR_USER',
                    passwordVariable: 'HARBOR_PASS'
                )]) {
                    sh '''
                        echo "$HARBOR_PASS" | docker login "$REGISTRY_URL" -u "$HARBOR_USER" --password-stdin
                    '''
                }
            }
        }

        stage('Push Image') {
            steps {
                sh "docker push $FULL_IMAGE"

                script {
                    if ((env.BRANCH_NAME ?: "Production") == "Production") {
                        echo "Pushing latest tag"
                        sh """
                            docker tag $FULL_IMAGE $FULL_IMAGE_LATEST
                            docker push $FULL_IMAGE_LATEST
                        """
                    } else {
                        echo "Branch is not Production. Skipping latest tag."
                    }
                }
            }
        }

        stage('Report') {
            steps {
                script {
                    echo "Image pushed: ${env.FULL_IMAGE}"
                    if ((env.BRANCH_NAME ?: "Production") == "Production") {
                        echo "Also pushed: ${env.FULL_IMAGE_LATEST}"
                    }
                }
            }
        }
    }

    post {
        always {
            sh """
                docker logout $REGISTRY_URL || true
                docker image prune -f || true
            """
        }
    }
}
