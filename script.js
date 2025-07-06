// script.js

let currentPath = null; 

const API_BASE_URL = `http://${window.location.hostname}:8080/`;

//console.log('API Base URL configurada para:', API_BASE_URL);

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
            document.getElementById('currentPathDisplay').textContent = currentPath;

            const isRoot = (currentPath.endsWith(':\\') && currentPath.length === 3) || (currentPath === '/');
            document.getElementById('goUpButton').style.display = isRoot ? 'none' : 'block';

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
            const errorText = data.error || response.statusText || 'Erro desconhecido';
            document.getElementById('fileList').textContent = `Erro ao carregar: ${errorText}`;
        }
    } catch (error) {
        document.getElementById('fileList').textContent = `Erro ao carregar: ${error.message}`;
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
    const separator = currentPath.includes('/') ? '/' : '\\';
    
    // Verifica se currentPath é a raiz absoluta (ex: '/' ou 'C:\')
    const isRoot = (currentPath.endsWith(':\\') && currentPath.length === 3) || (currentPath === '/');

    if (!isRoot) {
        // Remove a barra final se existir para evitar segmentos vazios no split
        let pathWithoutTrailingSlash = currentPath;
        if (currentPath.length > 1 && currentPath.endsWith(separator)) {
            pathWithoutTrailingSlash = currentPath.slice(0, -1);
        }

        // Divide o caminho em segmentos
        let pathSegments = pathWithoutTrailingSlash.split(separator);

        // Remove o último segmento (o diretório atual)
        if (pathSegments.length > 0) {
            pathSegments.pop();
        }

        let parentPath = pathSegments.join(separator);

        // Trata casos especiais para a raiz
        if (separator === '/' && parentPath === '') {
            parentPath = '/'; // Se voltar de "/pasta" para ""
        } else if (parentPath.length === 2 && parentPath.endsWith(':')) { // Caso de drives do Windows
            parentPath += '\\'; // Ex: "C:" se torna "C:\"
        } else if (separator === '/' && !parentPath.startsWith('/') && parentPath !== '') {
            // Garante que caminhos Unix-like sempre comecem com '/' (exceto a raiz pura)
            parentPath = '/' + parentPath;
        }

        console.log('Botão "Voltar": Caminho pai calculado:', parentPath);
        fetchFiles(parentPath);
    } else {
        console.log('Botão "Voltar": Já na raiz, recarregando a raiz.');
        fetchFiles(currentPath); // Já na raiz, apenas recarrega
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