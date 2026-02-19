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
    // Cek apakah container notifikasi sudah ada
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
    
    // Auto remove setelah 3 detik
    setTimeout(() => {
        notification.remove();
    }, 3000);
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
        generateLink: `generate.html?id=${generateId()}`,
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
    
    // Hapus juga gambar dari localStorage jika ada
    const imageKey = `twibbon_image_${id}`;
    localStorage.removeItem(imageKey);
    
    return true;
}

// ==================== IMAGE PROCESSING ====================

// Compress image sebelum disimpan
function compressImage(dataUrl, maxSize = 500) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = dataUrl;
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Resize jika terlalu besar
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                } else {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Kompres ke JPEG dengan kualitas 0.8
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
    });
}

// Convert file ke data URL
function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

// Validasi file gambar
function validateImage(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
        throw new Error('Tipe file tidak didukung. Gunakan JPG, PNG, atau GIF.');
    }
    
    if (file.size > maxSize) {
        throw new Error('Ukuran file terlalu besar. Maksimal 5MB.');
    }
    
    return true;
}

// ==================== GENERATE & DOWNLOAD ====================

// Generate twibbon dengan foto user
async function generateTwibbonImage(userPhotoData, twibbonData) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        
        // Load user photo
        const userImg = new Image();
        userImg.crossOrigin = "anonymous";
        
        userImg.onload = function() {
            // Gambar foto user sebagai background
            ctx.drawImage(userImg, 0, 0, canvas.width, canvas.height);
            
            // Load twibbon overlay
            const twibbonImg = new Image();
            twibbonImg.crossOrigin = "anonymous";
            
            twibbonImg.onload = function() {
                // Gambar twibbon di atas foto
                ctx.drawImage(twibbonImg, 0, 0, canvas.width, canvas.height);
                
                // Return hasil
                resolve(canvas.toDataURL('image/png'));
            };
            
            twibbonImg.src = twibbonData.image;
        };
        
        userImg.src = userPhotoData;
    });
}

// Download gambar
function downloadImage(dataUrl, filename = 'twibbon.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
}

// Copy teks ke clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Link berhasil disalin!', 'success');
    } catch (err) {
        // Fallback untuk browser lama
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('Link berhasil disalin!', 'success');
    }
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
        copyToClipboard(link);
        
        // Update views count
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
            copyToClipboard(link);
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
    
    try {
        validateImage(file);
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const ctx = canvas.getContext('2d');
                canvas.width = 300;
                canvas.height = 300;
                
                // Hitung posisi agar gambar pas di canvas
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width - img.width * scale) / 2;
                const y = (canvas.height - img.height * scale) / 2;
                
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        return true;
    } catch (error) {
        showNotification(error.message, 'error');
        input.value = '';
        return false;
    }
}

// Create twibbon baru
async function createNewTwibbon(name, file) {
    try {
        validateImage(file);
        
        // Convert ke data URL
        const dataUrl = await fileToDataUrl(file);
        
        // Compress image
        const compressedImage = await compressImage(dataUrl);
        
        // Simpan ke localStorage
        const twibbon = addTwibbon(name, compressedImage);
        
        showNotification('Twibbon berhasil dibuat!', 'success');
        
        // Redirect ke dashboard setelah 1 detik
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
        return twibbon;
    } catch (error) {
        showNotification(error.message, 'error');
        throw error;
    }
}

// ==================== GENERATE PAGE FUNCTIONS ====================

// Load twibbon untuk generate
function loadGeneratePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const twibbonId = urlParams.get('id');
    
    if (!twibbonId) {
        showNotification('ID Twibbon tidak ditemukan', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return null;
    }
    
    const twibbon = getTwibbonById(twibbonId);
    if (!twibbon) {
        showNotification('Twibbon tidak ditemukan', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return null;
    }
    
    return twibbon;
}

// Generate dengan foto user
async function generateWithUserPhoto(userPhotoFile, twibbon) {
    try {
        validateImage(userPhotoFile);
        
        // Convert user photo
        const userPhotoData = await fileToDataUrl(userPhotoFile);
        
        // Generate twibbon
        const result = await generateTwibbonImage(userPhotoData, twibbon);
        
        // Update download count
        updateTwibbon(twibbon.id, { downloads: (twibbon.downloads || 0) + 1 });
        
        return result;
    } catch (error) {
        showNotification(error.message, 'error');
        throw error;
    }
}

// ==================== EVENT LISTENERS ====================

// Login form handler
function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('errorMessage');
        
        // Credentials: username: user, password: #selaluamanah
        if (username === 'user' && password === '#selaluamanah') {
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('loginTime', new Date().toISOString());
            
            showNotification('Login berhasil!', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } else {
            errorDiv.textContent = 'Username atau password salah!';
            showNotification('Login gagal!', 'error');
        }
    });
}

// Create form handler
function initCreateForm() {
    const form = document.getElementById('createForm');
    const fileInput = document.getElementById('twibbonImage');
    const previewCanvas = document.getElementById('previewCanvas');
    
    if (!form) return;
    
    // Preview image
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            previewImage(this, 'previewCanvas');
        });
    }
    
    // Submit form
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('twibbonName').value;
        const file = document.getElementById('twibbonImage').files[0];
        
        if (!name || !file) {
            showNotification('Harap isi semua field!', 'error');
            return;
        }
        
        // Disable button
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';
        
        try {
            await createNewTwibbon(name, file);
        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Buat Twibbon';
        }
    });
}

// Generate page handler
function initGeneratePage() {
    const twibbon = loadGeneratePage();
    if (!twibbon) return;
    
    const fileInput = document.getElementById('userPhoto');
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const canvas = document.getElementById('resultCanvas');
    
    let generatedImage = null;
    
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            previewImage(this, 'resultCanvas');
        });
    }
    
    if (generateBtn) {
        generateBtn.addEventListener('click', async function() {
            const file = fileInput.files[0];
            
            if (!file) {
                showNotification('Harap pilih foto terlebih dahulu!', 'error');
                return;
            }
            
            // Disable button
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';
            
            try {
                generatedImage = await generateWithUserPhoto(file, twibbon);
                
                // Tampilkan di canvas
                const img = new Image();
                img.onload = function() {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                };
                img.src = generatedImage;
                
                // Tampilkan tombol download
                downloadBtn.style.display = 'inline-block';
                showNotification('Berhasil digenerate!', 'success');
            } catch (error) {
                console.error(error);
            } finally {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate';
            }
        });
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            if (generatedImage) {
                downloadImage(generatedImage, `twibbon-${Date.now()}.png`);
                showNotification('Download berhasil!', 'success');
            }
        });
    }
}

// ==================== INITIALIZATION ====================

// Inisialisasi berdasarkan halaman
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    
    // Tambahkan style untuk notifikasi
    const style = document.createElement('style');
    style.textContent = `
        .notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        }
        
        .notification {
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            animation: slideIn 0.3s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .notification-success {
            background-color: #27ae60;
        }
        
        .notification-error {
            background-color: #e74c3c;
        }
        
        .notification-info {
            background-color: #3498db;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .empty-state {
            text-align: center;
            padding: 50px;
            background: white;
            border-radius: 8px;
        }
        
        .empty-state img {
            max-width: 200px;
            margin-bottom: 20px;
        }
        
        .empty-state h3 {
            margin-bottom: 10px;
            color: #2c3e50;
        }
        
        .empty-state p {
            margin-bottom: 20px;
            color: #666;
        }
        
        .card-link {
            display: flex;
            gap: 5px;
            margin: 10px 0;
        }
        
        .card-link input {
            flex: 1;
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .card-actions {
            display: flex;
            gap: 5px;
            margin-top: 10px;
        }
        
        .btn-small {
            padding: 5px 10px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .btn-share {
            flex: 1;
            padding: 8px;
            background-color: #2ecc71;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .btn-delete {
            flex: 1;
            padding: 8px;
            background-color: #e74c3c;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .card-stats {
            display: flex;
            gap: 10px;
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }
        
        .card-date {
            color: #999;
            font-size: 12px;
            margin: 5px 0;
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
    
    // Inisialisasi berdasarkan halaman
    if (path.includes('login.html')) {
        initLoginForm();
    } else if (path.includes('dashboard.html')) {
        checkLogin();
        renderTwibbonGrid();
    } else if (path.includes('create.html')) {
        checkLogin();
        initCreateForm();
    } else if (path.includes('generate.html')) {
        initGeneratePage();
    }
    
    // Auto logout setelah 1 jam (security feature)
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
window.copyLink = copyLink;
window.shareTwibbon = shareTwibbon;
window.deleteTwibbonPrompt = deleteTwibbonPrompt;
window.downloadImage = downloadImage;