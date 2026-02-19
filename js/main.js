// ==================== UTILITY FUNCTIONS ====================

// Cek status login
function checkLogin() {
    if (!sessionStorage.getItem('isLoggedIn')) {
        window.location.href = 'login.html';
    }
}

// Fungsi logout
function logout() {
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Format tanggal
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Show notification
function showNotification(message, type = 'success') {
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ==================== EXPORT/IMPORT FUNCTIONS ====================

// Export data ke file JSON
function exportData() {
    try {
        const twibbons = localStorage.getItem('twibbons') || '[]';
        const dataStr = JSON.stringify(JSON.parse(twibbons), null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `twibbon-backup-${new Date().toISOString().slice(0,10)}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('Data berhasil diexport!', 'success');
    } catch (error) {
        showNotification('Gagal export data: ' + error.message, 'error');
    }
}

// Buka modal import
function importData() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        // Fallback: langsung buka file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const importedData = JSON.parse(event.target.result);
                        
                        // Validasi format data
                        if (Array.isArray(importedData)) {
                            // Backup data lama
                            const oldData = localStorage.getItem('twibbons');
                            
                            if (confirm('Data yang ada akan ditimpa. Lanjutkan?')) {
                                localStorage.setItem('twibbons', JSON.stringify(importedData));
                                showNotification('Data berhasil diimport!', 'success');
                                setTimeout(() => location.reload(), 1000);
                            }
                        } else {
                            showNotification('Format file tidak valid!', 'error');
                        }
                    } catch (error) {
                        showNotification('Gagal membaca file: ' + error.message, 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }
}

// Proses import dari modal
function processImport() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Pilih file terlebih dahulu!', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedData = JSON.parse(event.target.result);
            
            // Validasi format data
            if (Array.isArray(importedData)) {
                // Tanyakan konfirmasi
                if (confirm('Data yang ada akan ditimpa. Lanjutkan?')) {
                    localStorage.setItem('twibbons', JSON.stringify(importedData));
                    showNotification('Data berhasil diimport!', 'success');
                    closeModal();
                    setTimeout(() => location.reload(), 1000);
                }
            } else {
                showNotification('Format file tidak valid! Harus berupa array', 'error');
            }
        } catch (error) {
            showNotification('Gagal membaca file: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// Tutup modal
function closeModal() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'none';
        const fileInput = document.getElementById('importFile');
        if (fileInput) fileInput.value = '';
    }
}

// ==================== TWIBBON MANAGEMENT ====================

// Mendapatkan semua twibbon dari localStorage
function getTwibbons() {
    return JSON.parse(localStorage.getItem('twibbons') || '[]');
}

// Menyimpan twibbon ke localStorage
function saveTwibbons(twibbons) {
    localStorage.setItem('twibbons', JSON.stringify(twibbons));
}

// Menambahkan twibbon baru
function addTwibbon(name, imageData) {
    const twibbons = getTwibbons();
    const newTwibbon = {
        id: generateId(),
        name: name,
        image: imageData,
        createdAt: new Date().toISOString(),
        views: 0,
        downloads: 0
    };
    
    twibbons.push(newTwibbon);
    saveTwibbons(twibbons);
    
    return newTwibbon;
}

// Mendapatkan twibbon berdasarkan ID
function getTwibbonById(id) {
    const twibbons = getTwibbons();
    return twibbons.find(t => t.id === id);
}

// Update twibbon
function updateTwibbon(id, updates) {
    const twibbons = getTwibbons();
    const index = twibbons.findIndex(t => t.id === id);
    
    if (index !== -1) {
        twibbons[index] = { ...twibbons[index], ...updates };
        saveTwibbons(twibbons);
        return true;
    }
    
    return false;
}

// Hapus twibbon
function deleteTwibbon(id) {
    const twibbons = getTwibbons();
    const filtered = twibbons.filter(t => t.id !== id);
    saveTwibbons(filtered);
    return true;
}

// ==================== DASHBOARD FUNCTIONS ====================

// Render twibbon di dashboard
function renderTwibbonGrid() {
    const grid = document.getElementById('twibbonGrid');
    if (!grid) return;
    
    const twibbons = getTwibbons();
    
    if (twibbons.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <img src="assets/empty.svg" alt="No twibbon">
                <h3>Belum ada twibbon</h3>
                <p>Buat twibbon pertama Anda sekarang!</p>
                <a href="create.html" class="btn-primary">Buat Twibbon</a>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = twibbons.map(twibbon => `
        <div class="twibbon-card" data-id="${twibbon.id}">
            <div class="card-image">
                <img src="${twibbon.image}" alt="${twibbon.name}" loading="lazy">
            </div>
            <div class="card-content">
                <h3>${twibbon.name}</h3>
                <p class="card-date">Dibuat: ${formatDate(twibbon.createdAt)}</p>
                <p class="card-stats">
                    <span>👁️ ${twibbon.views || 0}</span>
                    <span>⬇️ ${twibbon.downloads || 0}</span>
                </p>
                <div class="card-link">
                    <input type="text" value="${window.location.origin}/generate.html?id=${twibbon.id}" readonly>
                    <button onclick="copyLink('${twibbon.id}')" class="btn-small">Copy</button>
                </div>
                <div class="card-actions">
                    <button onclick="shareTwibbon('${twibbon.id}')" class="btn-share">Share</button>
                    <button onclick="deleteTwibbonPrompt('${twibbon.id}')" class="btn-delete">Hapus</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Copy link twibbon
function copyLink(id) {
    const twibbon = getTwibbonById(id);
    if (twibbon) {
        const link = `${window.location.origin}/generate.html?id=${twibbon.id}`;
        navigator.clipboard.writeText(link);
        showNotification('Link berhasil disalin!', 'success');
        
        updateTwibbon(id, { views: (twibbon.views || 0) + 1 });
    }
}

// Share twibbon
function shareTwibbon(id) {
    const twibbon = getTwibbonById(id);
    if (twibbon) {
        const link = `${window.location.origin}/generate.html?id=${twibbon.id}`;
        
        if (navigator.share) {
            navigator.share({
                title: twibbon.name,
                text: `Buat twibbon ${twibbon.name} sekarang!`,
                url: link
            });
        } else {
            copyLink(id);
        }
    }
}

// Delete twibbon dengan konfirmasi
function deleteTwibbonPrompt(id) {
    if (confirm('Apakah Anda yakin ingin menghapus twibbon ini?')) {
        deleteTwibbon(id);
        renderTwibbonGrid();
        showNotification('Twibbon berhasil dihapus', 'success');
    }
}

// ==================== CREATE PAGE FUNCTIONS ====================

// Preview gambar yang diupload
function previewImage(input, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const ctx = canvas.getContext('2d');
            canvas.width = 300;
            canvas.height = 300;
            
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ==================== GENERATE PAGE FUNCTIONS ====================

// Load twibbon untuk generate
function loadGeneratePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const twibbonId = urlParams.get('id');
    
    const twibbonInfo = document.getElementById('twibbonInfo');
    
    if (!twibbonId) {
        if (twibbonInfo) {
            twibbonInfo.innerHTML = '<div class="error-message">ID Twibbon tidak ditemukan!</div>';
        }
        return null;
    }
    
    const twibbon = getTwibbonById(twibbonId);
    
    if (twibbonInfo) {
        if (twibbon) {
            twibbonInfo.innerHTML = `
                <div class="twibbon-info-card">
                    <h2>${twibbon.name}</h2>
                    <img src="${twibbon.image}" alt="${twibbon.name}" class="twibbon-preview">
                </div>
            `;
        } else {
            twibbonInfo.innerHTML = `
                <div class="error-message">
                    <h3>Twibbon tidak ditemukan!</h3>
                    <p>Mungkin Anda perlu meng-import data terlebih dahulu.</p>
                    <button onclick="window.location.href='dashboard.html'" class="btn-primary">Ke Dashboard</button>
                </div>
            `;
        }
    }
    
    return twibbon;
}

// Generate twibbon
async function generateTwibbon() {
    const urlParams = new URLSearchParams(window.location.search);
    const twibbonId = urlParams.get('id');
    const twibbon = getTwibbonById(twibbonId);
    
    if (!twibbon) {
        showNotification('Twibbon tidak ditemukan!', 'error');
        return;
    }
    
    const fileInput = document.getElementById('userPhoto');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Harap pilih foto terlebih dahulu!', 'error');
        return;
    }
    
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
    try {
        const userImg = new Image();
        userImg.src = URL.createObjectURL(file);
        
        await new Promise((resolve) => {
            userImg.onload = function() {
                ctx.drawImage(userImg, 0, 0, canvas.width, canvas.height);
                
                const twibbonImg = new Image();
                twibbonImg.onload = function() {
                    ctx.drawImage(twibbonImg, 0, 0, canvas.width, canvas.height);
                    
                    window.generatedImage = canvas.toDataURL('image/png');
                    downloadBtn.style.display = 'inline-block';
                    
                    updateTwibbon(twibbonId, { downloads: (twibbon.downloads || 0) + 1 });
                    
                    showNotification('Berhasil digenerate!', 'success');
                    resolve();
                };
                twibbonImg.src = twibbon.image;
            };
        });
    } catch (error) {
        showNotification('Gagal generate: ' + error.message, 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate';
    }
}

// Download gambar
function downloadImage() {
    if (window.generatedImage) {
        const link = document.createElement('a');
        link.download = `twibbon-${Date.now()}.png`;
        link.href = window.generatedImage;
        link.click();
        showNotification('Download berhasil!', 'success');
    }
}

// ==================== LOGIN FORM HANDLER ====================

function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('errorMessage');
        
        if (username === 'user' && password === '#selaluamanah') {
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('loginTime', new Date().toISOString());
            showNotification('Login berhasil!', 'success');
            setTimeout(() => window.location.href = 'dashboard.html', 500);
        } else {
            errorDiv.textContent = 'Username atau password salah!';
        }
    });
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    
    // Inisialisasi berdasarkan halaman
    if (path.includes('login.html')) {
        initLoginForm();
    } else if (path.includes('dashboard.html')) {
        checkLogin();
        renderTwibbonGrid();
    } else if (path.includes('create.html')) {
        checkLogin();
        
        const createForm = document.getElementById('createForm');
        if (createForm) {
            document.getElementById('twibbonImage').addEventListener('change', function(e) {
                previewImage(this, 'previewCanvas');
            });
            
            createForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const name = document.getElementById('twibbonName').value;
                const file = document.getElementById('twibbonImage').files[0];
                
                if (!name || !file) {
                    showNotification('Harap isi semua field!', 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    addTwibbon(name, event.target.result);
                    showNotification('Twibbon berhasil dibuat!', 'success');
                    setTimeout(() => window.location.href = 'dashboard.html', 1000);
                };
                reader.readAsDataURL(file);
            });
        }
    } else if (path.includes('generate.html')) {
        loadGeneratePage();
    }
    
    // Auto logout setelah 1 jam
    if (sessionStorage.getItem('isLoggedIn')) {
        const loginTime = new Date(sessionStorage.getItem('loginTime')).getTime();
        const now = new Date().getTime();
        const hourInMs = 60 * 60 * 1000;
        
        if (now - loginTime > hourInMs) {
            logout();
            showNotification('Sesi berakhir, silakan login kembali', 'info');
        }
    }
});

// Export functions untuk digunakan di HTML
window.logout = logout;
window.exportData = exportData;
window.importData = importData;
window.processImport = processImport;
window.closeModal = closeModal;
window.copyLink = copyLink;
window.shareTwibbon = shareTwibbon;
window.deleteTwibbonPrompt = deleteTwibbonPrompt;
window.generateTwibbon = generateTwibbon;
window.downloadImage = downloadImage;