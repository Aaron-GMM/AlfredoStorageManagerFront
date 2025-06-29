// script.js

// currentPath será definido dinamicamente pela primeira chamada fetchFiles
let currentPath = null; 

async function fetchFiles(pathParam = null) { 
    try {
        let url;
        if (pathParam === null || pathParam === currentPath) { 
             url = `http://localhost:8080/files`;
        } else { 
             url = `http://localhost:8080/files?path=${encodeURIComponent(pathParam)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && data.files) { // Adicionei response.ok aqui para melhor erro
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
        } else { // Tratamento de erro consolidado
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
    const separator = currentPath.includes('/') ? '/' : '\\';
    let lastSeparatorIndex = currentPath.lastIndexOf(separator);

    const isRoot = (currentPath.endsWith(':\\') && currentPath.length === 3) || (currentPath === '/');

    if (!isRoot) {
        let parentPath = currentPath.substring(0, lastSeparatorIndex);
        
        if (parentPath.length === 2 && parentPath.endsWith(':')) {
            parentPath += '\\';
        } else if (parentPath === '') { 
            parentPath = '/';
        }

        fetchFiles(parentPath);
    } else {
        fetchFiles(currentPath); 
    }
});

// --- Início da Modificação: Adicionar Log ao Clique do Botão ---
document.getElementById('createFolderButton').addEventListener('click', async () => {
    console.log('Botão "Criar Pasta" clicado!'); // Este log aparecerá no Console do Navegador

    const folderName = document.getElementById('newFolderName').value;
    const messageElement = document.getElementById('createFolderMessage');

    if (!folderName) {
        messageElement.textContent = 'Por favor, insira um nome para a pasta.';
        messageElement.style.color = 'red';
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/create-folder', {
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
            document.getElementById('newFolderName').value = ''; // Limpa o campo
            fetchFiles(currentPath); // Atualiza a lista de arquivos
        } else {
            const errorText = await response.text();
            messageElement.textContent = `Erro ao criar pasta: ${errorText}`;
            messageElement.style.color = 'red';
            console.error('Erro na resposta do servidor para criar pasta:', errorText); // Log de erro no console
        }
    } catch (error) {
        messageElement.textContent = `Erro na comunicação com o servidor: ${error.message}`;
        messageElement.style.color = 'red';
        console.error('Erro na requisição fetch para criar pasta:', error); // Log de erro na comunicação
    }
});


fetchFiles(null);