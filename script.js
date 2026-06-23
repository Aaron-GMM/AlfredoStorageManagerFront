const API_BASE_URL = '';
let currentPath = '';
let authHeader = '';

// Icons
const ICONS = {
    folder: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></svg>`,
    file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`,
    delete: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
    rename: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon></svg>`
};

document.addEventListener('DOMContentLoaded', init);

function init() {
    setupAuth();
    setupEventListeners();
}

function showLogin() {
    document.getElementById('login-overlay').classList.add('active');
    document.getElementById('app-container').style.display = 'none';
}

function showApp() {
    document.getElementById('login-overlay').classList.remove('active');
    document.getElementById('app-container').style.display = 'flex';
    loadFiles('');
}

function setupAuth() {
    document.getElementById('login-form').onsubmit = async (e) => {
        e.preventDefault();
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;
        const errP = document.getElementById('login-error');
        errP.style.display = 'none';

        try {
            const res = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });
            const data = await res.json();
            
            if(!res.ok) throw new Error(data.error || 'Erro no login');
            
            // Login successful
            showApp();
        } catch(e) {
            errP.textContent = e.message;
            errP.style.display = 'block';
        }
    };

    // Try loading files directly to check if cookie is valid
    loadFiles('');
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {},
        credentials: 'same-origin'
    };
    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await res.json();
    
    if (!res.ok) {
        if(res.status === 401) {
            showLogin();
            throw new Error('Sessão expirada. Faça login novamente.');
        }
        throw new Error(data.error || 'Erro na API');
    }
    return data;
}

async function loadFiles(path) {
    try {
        const data = await apiCall(`/files?path=${encodeURIComponent(path)}`);
        document.getElementById('app-container').style.display = 'flex';
        document.getElementById('login-overlay').classList.remove('active');
        currentPath = data.current_path;
        renderBreadcrumb(data.current_path, data.app_root_path);
        renderFiles(data.files || []);
    } catch (e) {
        alert(e.message);
    }
}

function renderBreadcrumb(path, rootPath) {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = '';
    
    // Normalize paths
    let relativePath = path.replace(rootPath, '');
    if(relativePath.startsWith('/')) relativePath = relativePath.substring(1);
    
    const parts = relativePath.split('/').filter(p => p);
    
    let currentAcc = rootPath;
    
    // Home Root
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = 'Raiz';
    a.onclick = (e) => { e.preventDefault(); loadFiles(''); };
    breadcrumb.appendChild(a);
    
    parts.forEach(part => {
        const span = document.createElement('span');
        span.textContent = ' / ';
        span.style.color = 'var(--text-secondary)';
        breadcrumb.appendChild(span);
        
        currentAcc += (currentAcc.endsWith('/') ? '' : '/') + part;
        
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = part;
        const targetPath = currentAcc;
        link.onclick = (e) => { e.preventDefault(); loadFiles(targetPath); };
        breadcrumb.appendChild(link);
    });
}

function renderFiles(files) {
    const area = document.getElementById('file-area');
    area.innerHTML = '';
    
    // Sort: Folders first, then alphabetically
    files.sort((a, b) => {
        if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
        return a.is_dir ? -1 : 1;
    });
    
    files.forEach(f => {
        const card = document.createElement('div');
        card.className = 'file-card';
        
        const isFolder = f.is_dir;
        
        card.innerHTML = `
            <div class="file-icon ${isFolder ? 'folder-icon' : ''}">
                ${isFolder ? ICONS.folder : ICONS.file}
            </div>
            <div class="file-name" title="${f.name}">${f.name}</div>
            <div class="file-size">${isFolder ? '--' : formatSize(f.size)}</div>
            
            <div class="file-actions">
                ${!isFolder ? `<button class="action-btn download" title="Baixar" data-path="${f.path}">${ICONS.download}</button>` : ''}
                <button class="action-btn rename" title="Renomear" data-path="${f.path}" data-name="${f.name}">${ICONS.rename}</button>
                <button class="action-btn delete" title="Excluir" data-path="${f.path}">${ICONS.delete}</button>
            </div>
        `;
        
        // Clicar no card inteiro (mas evitar botões de ação)
        card.onclick = (e) => {
            if(e.target.closest('.action-btn')) return;
            if(isFolder) {
                loadFiles(f.path);
            }
        };
        
        area.appendChild(card);
    });
}

// --- Actions ---

function setupEventListeners() {
    // Nova Pasta
    document.getElementById('btn-new-folder').onclick = () => {
        document.getElementById('modal-new-folder').classList.add('active');
        document.getElementById('modal-overlay').classList.add('active');
        document.getElementById('input-folder-name').focus();
    };
    
    document.getElementById('btn-confirm-folder').onclick = async () => {
        const name = document.getElementById('input-folder-name').value;
        if(!name) return;
        try {
            await apiCall('/create-folder', 'POST', { path: currentPath, folder_name: name });
            closeModals();
            loadFiles(currentPath);
        } catch(e) {
            alert(e.message);
        }
    };
    
    // Fechar modais
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
        el.onclick = closeModals;
    });
    
    // Ações de Arquivo (Deletar, Baixar, Renomear) via Delegação de Eventos
    document.getElementById('file-area').onclick = async (e) => {
        const btn = e.target.closest('.action-btn');
        if(!btn) return;
        
        const path = btn.dataset.path;
        
        if (btn.classList.contains('delete')) {
            if(confirm("Tem certeza que deseja excluir este item?")) {
                try {
                    await apiCall(`/delete?path=${encodeURIComponent(path)}`, 'DELETE');
                    loadFiles(currentPath);
                } catch(e) { alert(e.message); }
            }
        }
        else if (btn.classList.contains('download')) {
            // Como usamos cookie HttpOnly, o link direto já passará a autenticação
            const url = `${API_BASE_URL}/download?path=${encodeURIComponent(path)}`;
            
            const a = document.createElement('a');
            a.href = url;
            a.download = ''; 
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        else if (btn.classList.contains('rename')) {
            const oldName = btn.dataset.name;
            document.getElementById('input-rename').value = oldName;
            document.getElementById('input-rename').dataset.path = path;
            
            document.getElementById('modal-rename').classList.add('active');
            document.getElementById('modal-overlay').classList.add('active');
            document.getElementById('input-rename').focus();
        }
    };
    
    // Confirmar Rename
    document.getElementById('btn-confirm-rename').onclick = async () => {
        const newName = document.getElementById('input-rename').value;
        const oldPath = document.getElementById('input-rename').dataset.path;
        if(!newName) return;
        
        try {
            await apiCall('/rename', 'POST', { old_path: oldPath, new_name: newName });
            closeModals();
            loadFiles(currentPath);
        } catch(e) {
            alert(e.message);
        }
    };
    
    // Upload de Arquivos via fetch
    const fileInput = document.getElementById('file-upload');
    fileInput.onchange = async () => {
        const files = fileInput.files;
        if(files.length === 0) return;
        
        const formData = new FormData();
        for(let i=0; i<files.length; i++) {
            formData.append('file', files[i]);
        }
        
        try {
            const res = await fetch(`${API_BASE_URL}/upload?path=${encodeURIComponent(currentPath)}`, {
                method: 'POST',
                credentials: 'same-origin',
                body: formData
            });
            const data = await res.json();
            if(!res.ok) {
                if(res.status === 401) {
                    showLogin();
                    throw new Error('Sessão expirada.');
                }
                throw new Error(data.error);
            }
            
            loadFiles(currentPath);
            fileInput.value = ''; // Reseta o input
        } catch (e) {
            alert("Erro no upload: " + e.message);
        }
    };
}

function closeModals() {
    document.querySelectorAll('.modal, .modal-overlay').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.modal input').forEach(el => el.value = '');
}
