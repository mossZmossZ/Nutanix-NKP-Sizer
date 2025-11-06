pipeline {
    agent any

    options {
        timestamps()
    }

    environment {
        CREDENTIALS_ID = "harbor-creds"   // ONLY credentials stay here
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Short SHA of commit
                    env.GIT_SHA = env.GIT_COMMIT.take(7)

                    // Branch name (should be Production)
                    def branch = (env.BRANCH_NAME ?: "Production")
                        .replaceAll('[^A-Za-z0-9._-]', '-')

                    // Build tag
                    env.IMAGE_TAG = "${branch}-${env.GIT_SHA}"

                    // Build full registry URLs using global env vars
                    env.FULL_IMAGE = "${env.REGISTRY_URL}/${env.PROJECT}/${env.IMAGE_NAME}:${env.IMAGE_TAG}"
                    env.FULL_IMAGE_LATEST = "${env.REGISTRY_URL}/${env.PROJECT}/${env.IMAGE_NAME}:latest"

                    echo "Building image: ${env.FULL_IMAGE}"
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh """
                    docker build \
                        --pull \
                        --label ci.build.number=${BUILD_NUMBER} \
                        --label ci.git.branch=${BRANCH_NAME} \
                        --label ci.git.commit=${GIT_COMMIT} \
                        -t ${FULL_IMAGE} .
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
                sh "docker push ${FULL_IMAGE}"

                script {
                    // Push 'latest' only for Production branch
                    if (env.BRANCH_NAME == "Production") {
                        sh """
                            docker tag ${FULL_IMAGE} ${FULL_IMAGE_LATEST}
                            docker push ${FULL_IMAGE_LATEST}
                        """
                    }
                }
            }
        }

        stage('Report') {
            steps {
                echo "Image pushed: ${env.FULL_IMAGE}"
                if (env.BRANCH_NAME == "Production") {
                    echo "Also pushed: ${env.FULL_IMAGE_LATEST}"
                }
            }
        }
    }

    post {
        always {
            sh """
                docker logout ${REGISTRY_URL} || true
                docker image prune -f || true
            """
        }
    }
}
