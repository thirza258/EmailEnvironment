pipeline {

    agent any

    stages {
        stage('Cleanup Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Debug') {
            steps {
                sh '''
                pwd
                ls -lah
                file nginx.conf || true
                '''
            }
        }

        stage('Generate .env') {

            steps {

                script {

                    withCredentials([

                        string(
                            credentialsId: 'NEXT_PUBLIC_GEMINI_API_KEY',
                            variable: 'NEXT_PUBLIC_GEMINI_API_KEY'
                        )

                    ]) {

                    sh '''
cat > .env <<EOF
NEXT_PUBLIC_GEMINI_API_KEY=${NEXT_PUBLIC_GEMINI_API_KEY}
EOF
'''
                    }
                }
            }
        }
        stage('Deploy') {

            steps {
                sh '''
                docker compose down || true
                docker compose up -d --build
                '''
            }
        }

        stage('Cleanup') {

            steps {
                sh '''
                docker image prune -f
                '''
            }
        }
    }
}