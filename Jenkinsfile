pipeline {
    agent any

    tools {
        jdk 'JDK19'
        maven 'MAVEN3.3.9windows'
    }

    environment {
        DOCKER_REGISTRY = 'mariammseddi12'
        JAVA_HOME = 'C:\\Program Files\\Java\\jdk-19'
        K8S_NAMESPACE = 'microservice'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo '📦 Clonage du dépôt Angular...'
                git url: 'https://github.com/Mariam322/Angular-Project.git', branch: 'main'
            }
        }

        stage('Build Angular App') {
            steps {
                echo '⚙️ Construction du projet Angular...'
                bat '''
                    cd Front
                    call npm install
                    call npm run build --prod
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                echo '🐳 Construction de l’image Docker du frontend...'
                dir('Front') {
                    bat "docker build -t ${DOCKER_REGISTRY}/angular-frontend ."
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                echo '📤 Envoi de l’image Docker sur Docker Hub...'
                withCredentials([usernamePassword(
                    credentialsId: 'DockerHub',
                    passwordVariable: 'DockerHubPassword',
                    usernameVariable: 'DockerHubUsername'
                )]) {
                    bat """
                        docker login -u ${DockerHubUsername} -p ${DockerHubPassword}
                        docker push ${DOCKER_REGISTRY}/angular-frontend
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo '🚀 Déploiement du frontend sur Kubernetes...'
                script {
                    withKubeConfig([credentialsId: 'ovh-kubernetes-credentials']) {
                        bat """
                            kubectl create namespace ${K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
                            kubectl apply -f kubernetes/frontend.yaml -n ${K8S_NAMESPACE}
                            kubectl rollout status deployment/angular-frontend -n ${K8S_NAMESPACE} --timeout=300s
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo '✅ Déploiement du frontend Angular réussi !'
        }
        failure {
            echo '❌ Le pipeline a échoué. Vérifie les logs Jenkins.'
        }
    }
}
