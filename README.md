#  Alfredo Storage Manager (Frontend)

> A interface web veloz e responsiva para gerenciar o armazenamento de seus arquivos. Construída de forma puramente estática para ser entregue nativamente via Nginx.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

##  Sobre o Projeto
Este é o cliente SPA (Single Page Application) do **Alfredo Storage Manager**. O frontend foi totalmente desacoplado do backend para extrair o máximo de velocidade e poupar recursos em ambientes de nuvem limitados.
Ele interage nativamente com a API headless consumindo JSON de forma assíncrona.

##  Arquitetura e Deploy (Nginx)
A grande sacada dessa arquitetura é que **nenhum processamento de backend** é gasto para entregar este frontend. Recomenda-se veementemente a configuração do servidor web Nginx apontando o seu *root* diretamente para esta pasta e repassando requisições da rota `/api/` como *Reverse Proxy* para o backend.

### Configuração de Exemplo
Exemplo de um snippet simplificado de Nginx:
```nginx
server {
    listen 80;
    root /caminho/para/AlfredoStorageManagerFront;
    index index.html;

    # Single Page Application Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para a API Go
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
    }
}
```

## 🛠️ Modificações Locais
Como não existe etapa de *build* (Node.js, Webpack, etc.), basta abrir o arquivo `index.html` no seu navegador ou editar o seu `style.css`/`script.js` e atualizar a página. Qualquer mudança de layout é refletida em tempo real sem a necessidade de recomplilações custosas no servidor.

## 🔗 Links Úteis
- [Repositório da API (Backend)](https://github.com/Aaron-GMM/AlfredoStorageManager)
