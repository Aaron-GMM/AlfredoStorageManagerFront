
let currentPath = null; 

async function fetchFiles(pathParam = null) { 
    try {
        let url;
        // Para a carga inicial ou quando queremos o conteúdo do diretório raiz
        if (pathParam === null || pathParam === currentPath) { 
             url = `http://localhost:8080/files`;
        } else { 
             url = `http://localhost:8080/files?path=${encodeURIComponent(pathParam)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.files) {
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
        } else if (data.error) {
            document.getElementById('fileList').textContent = `Erro: ${data.error}`;
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
        // Já na raiz, apenas recarrega o conteúdo da raiz
        fetchFiles(currentPath); 
    }
});


fetchFiles(null);