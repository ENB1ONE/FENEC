import sys

config_path = "/etc/nginx/sites-available/alfa-api"

with open(config_path, "r") as f:
    content = f.read()

# Replace the fenec-api location block with the clean, non-duplicating CORS block
old_block_marker = "location /fenec-api/ {"
if old_block_marker not in content:
    print("location /fenec-api/ not found!")
    sys.exit(1)

new_location_block = """    location /fenec-api/ {
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '$http_origin' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, Origin, User-Agent, X-Requested-With' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        client_max_body_size 25M;
        rewrite ^/fenec-api/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:8005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }"""

# Find start of location /fenec-api/ and end before location / {
start_idx = content.find("location /fenec-api/ {")
end_idx = content.find("location / {", start_idx)

if start_idx == -1 or end_idx == -1:
    print(f"Error parsing indexes: start={start_idx}, end={end_idx}")
    sys.exit(1)

updated_content = content[:start_idx] + new_location_block + "\n\n    " + content[end_idx:]

with open(config_path, "w") as f:
    f.write(updated_content)

print("✅ /etc/nginx/sites-available/alfa-api atualizado com sucesso!")
