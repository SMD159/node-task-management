# node-task-management

docker-compose up -d

docker exec -it node_app npm run migrate:latest

if Knex is missing inside the container:
docker exec -it node_app npm install -g knex


if port already used:
netstat -ano | findstr :3000 
taskkill /PID <PID> /F  