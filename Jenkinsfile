pipeline {
    agent any

    options {
        timestamps()
    }

    environment {
        CREDENTIALS_ID = "harbor-creds"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_SHA = env.GIT_COMMIT.take(7)

                    // BRANCH_NAME is available only in multibranch jobs; fallback for single-branch jobs
                    def branchName = env.BRANCH_NAME ?: "Production"

                    def branch = branchName.replaceAll('[^A-Za-z0-9._-]', '-')

                    env.IMAGE_TAG = "${branch}-${env.GIT_SHA}"
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
