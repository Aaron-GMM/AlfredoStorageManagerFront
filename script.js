// script.js

let currentPath = null;
let appRootPath = null; 

const API_BASE_URL = `http://${window.location.hostname}:8080/`;

async function fetchFiles(pathParam = null) {
    try {
        let url;
        if (pathParam === null || pathParam === currentPath) {
            url = API_BASE_URL + `files`;
        } else {
            url = API_BASE_URL + `files?path=${encodeURIComponent(pathParam)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && data.files) {
            const fileListElement = document.getElementById('fileList');
            fileListElement.innerHTML = '';

            currentPath = data.current_path;
            appRootPath = data.app_root_path; 
            document.getElementById('currentPathDisplay').textContent = currentPath;

            const isAppRoot = (currentPath === appRootPath);
            document.getElementById('goUpButton').style.display = isAppRoot ? 'none' : 'block';

            data.files.forEach(item => {
                const div = document.createElement('div');
                div.textContent = item.name;
                if (item.is_dir) {
                    div.className = 'file-item is-dir';
                    div.onclick = () => navigateTo(item.name);
                } else {
                    div.className = 'file-item';
                }
                fileListElement.appendChild(div);
            });
        } else {
  
            try {
                const errorText = await response.text(); // Tenta ler a resposta como texto
                document.getElementById('fileList').textContent = `Erro do servidor: ${response.status} - ${errorText}`;
            } catch (e) {
                document.getElementById('fileList').textContent = `Erro ao carregar: ${response.status} ${response.statusText || 'Erro desconhecido'}`;
            }
        }
    } catch (error) {
        document.getElementById('fileList').textContent = `Erro de comunicação: ${error.message}`;
    }
}

function navigateTo(folderName) {
    let newPath;
    const separator = currentPath.includes('/') ? '/' : '\\';

    if (currentPath.endsWith(separator)) {
        newPath = `${currentPath}${folderName}`;
    } else {
        newPath = `${currentPath}${separator}${folderName}`;
    }
    fetchFiles(newPath);
}

document.getElementById('goUpButton').addEventListener('click', () => {
    console.log('Botão "Voltar" clicado. currentPath antes:', currentPath);
    console.log('Botão "Voltar" clicado. appRootPath:', appRootPath); // Debug para ver o appRootPath

    const separator = currentPath.includes('/') ? '/' : '\\';

    // Agora a condição de raiz é baseada no appRootPath
    const isAppRoot = (currentPath === appRootPath);

    if (isAppRoot) { 
       // console.log('Botão "Voltar": Já na raiz da aplicação, não é possível subir mais.');
        document.getElementById('fileList').textContent = `Você está no diretório raiz da aplicação: ${appRootPath}`; 
        document.getElementById('goUpButton').style.display = 'none'; 
        fetchFiles(appRootPath); 
        return; // Não prossegue com o cálculo do parentPath
    }

    let pathWithoutTrailingSlash = currentPath;
    if (currentPath.length > 1 && currentPath.endsWith(separator)) {
        pathWithoutTrailingSlash = currentPath.slice(0, -1);
    }

    let pathSegments = pathWithoutTrailingSlash.split(separator);

    if (pathSegments.length > 0) {
        pathSegments.pop(); 

        let parentPath = pathSegments.join(separator);

       
        if (separator === '/' && parentPath === '') {
            parentPath = '/';
        } else if (parentPath.length === 2 && parentPath.endsWith(':')) {
            parentPath += '\\';
        } else if (separator === '/' && currentPath.startsWith('/') && parentPath !== '') {
            parentPath = '/' + parentPath;
        }

        console.log('Botão "Voltar": Caminho pai calculado:', parentPath);

        fetchFiles(parentPath);
    } else {
       
        console.log('Botão "Voltar": Caminho inconsistente, recarregando a raiz da aplicação.');
        fetchFiles(appRootPath);
    }
});

document.getElementById('createFolderButton').addEventListener('click', async () => {
    console.log('Botão "Criar Pasta" clicado!');

    const folderName = document.getElementById('newFolderName').value;
    const messageElement = document.getElementById('createFolderMessage');

    if (!folderName) {
        messageElement.textContent = 'Por favor, insira um nome para a pasta.';
        messageElement.style.color = 'red';
        return;
    }

    try {
        const response = await fetch(API_BASE_URL + 'create-folder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path: currentPath,
                folder_name: folderName,
            }),
        });

        if (response.ok) {
            messageElement.textContent = `Pasta '${folderName}' criada com sucesso!`;
            messageElement.style.color = 'green';
            document.getElementById('newFolderName').value = '';
            fetchFiles(currentPath);
        } else {
            const errorText = await response.text();
            messageElement.textContent = `Erro ao criar pasta: ${errorText}`;
            messageElement.style.color = 'red';
            console.error('Erro na resposta do servidor para criar pasta:', errorText);
        }
    } catch (error) {
        messageElement.textContent = `Erro na comunicação com o servidor: ${error.message}`;
        messageElement.style.color = 'red';
        console.error('Erro na requisição fetch para criar pasta:', error);
    }
});

fetchFiles(null);