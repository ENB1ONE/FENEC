with open("/etc/nginx/sites-available/alfa-api", "r") as f:
    content = f.read()

fenec_block = """
    location /fenec-api/ {
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, Origin, User-Agent' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

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
    }
"""

if "/fenec-api/" not in content:
    target = "    location / {"
    content = content.replace(target, fenec_block + "\n" + target, 1)
    with open("/etc/nginx/sites-available/alfa-api", "w") as f:
        f.write(content)
    print("Bloco fenec-api adicionado com sucesso.")
else:
    print("Bloco fenec-api ja existe.")
