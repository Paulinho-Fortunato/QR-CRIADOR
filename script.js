// Verifica se o localStorage está disponível
function isLocalStorageAvailable() {
    try {
        const testKey = '__test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    if (isLocalStorageAvailable()) {
        localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
    }
});

// Load saved theme
function loadTheme() {
    let theme = 'light';
    
    if (isLocalStorageAvailable() && localStorage.getItem('theme')) {
        theme = localStorage.getItem('theme');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        theme = 'dark';
    }
    
    if (theme === 'dark') {
        html.classList.add('dark');
        themeToggle.textContent = '☀️';
    } else {
        html.classList.remove('dark');
        themeToggle.textContent = '🌙';
    }
}

// Chama a função de carregamento do tema
loadTheme();

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.content').forEach(c => c.style.display = 'none');
        
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).style.display = 'block';
    });
});

// QR type switching
const qrType = document.getElementById('qrType');
qrType.addEventListener('change', () => {
    ['textFields', 'urlFields', 'contactFields', 'wifiFields'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    document.getElementById(`${qrType.value}Fields`).style.display = 'block';
});

// Color picker
let selectedColor = '#000';
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        selectedColor = option.dataset.color;
        if (window.qrCode) generateQR();
    });
});

// Toast notifications
const toast = document.getElementById('toast');
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Generate QR
let qrCode = null;
document.getElementById('generateBtn').addEventListener('click', generateQR);

function generateQR() {
    try {
        let content = '';
        const type = qrType.value;
        
        switch(type) {
            case 'text':
                content = document.getElementById('textContent').value.trim();
                if (!content) {
                    showToast('Por favor, insira um texto');
                    return;
                }
                break;
            case 'url':
                content = document.getElementById('urlContent').value.trim();
                if (!content || !isValidUrl(content)) {
                    showToast('Por favor, insira uma URL válida');
                    return;
                }
                break;
            case 'contact':
                const name = document.getElementById('contactName').value.trim();
                const phone = document.getElementById('contactPhone').value.trim();
                if (!name || !phone) {
                    showToast('Nome e telefone são obrigatórios');
                    return;
                }
                const countryCode = document.getElementById('countryCode').value;
                content = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;TYPE=CELL:${countryCode} ${phone}\nEND:VCARD`;
                break;
            case 'wifi':
                const ssid = document.getElementById('wifiSsid').value.trim();
                if (!ssid) {
                    showToast('SSID é obrigatório');
                    return;
                }
                const password = document.getElementById('wifiPassword').value.trim();
                content = `WIFI:S:${ssid};P:${password};;`;
                break;
        }
        
        // Limpa o container do QR
        const qrcodeContainer = document.getElementById('qrcode');
        qrcodeContainer.innerHTML = '';
        
        // Converte o tamanho para número
        const size = parseInt(document.getElementById('qrSize').value);
        
        // Gera o QR code
        qrCode = new QRCode(qrcodeContainer, {
            text: content,
            width: size,
            height: size,
            colorDark: selectedColor,
            colorLight: '#ffffff'
        });
        
        showToast('QR gerado com sucesso!');
    } catch (error) {
        console.error('Erro ao gerar QR:', error);
        showToast(`Erro: ${error.message}`);
    }
}

// Valida URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Download QR
document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!qrCode) {
        showToast('Gere um QR primeiro');
        return;
    }
    
    const canvas = document.querySelector('#qrcode canvas');
    if (!canvas) {
        showToast('QR não encontrado');
        return;
    }
    
    try {
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `qrcode-${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        showToast('Baixado com sucesso!');
    } catch (error) {
        console.error('Erro ao baixar:', error);
        showToast(`Erro ao baixar: ${error.message}`);
    }
});

// QR Reader
let scanner = null;
const startScanBtn = document.getElementById('startScanBtn');
const stopScanBtn = document.getElementById('stopScanBtn');

startScanBtn.addEventListener('click', () => {
    startScanBtn.style.display = 'none';
    stopScanBtn.style.display = 'inline-block';
    
    try {
        scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 250 }, false);
        
        scanner.render(
            (decodedText) => {
                document.getElementById('scanText').textContent = decodedText;
                document.getElementById('scanResult').classList.add('show');
                document.getElementById('scanSound').play();
                scanner.clear();
                startScanBtn.style.display = 'inline-block';
                stopScanBtn.style.display = 'none';
                showToast('QR lido com sucesso!');
            },
            (err) => {
                console.log('Scan error:', err);
            }
        );
    } catch (error) {
        console.error('Erro ao iniciar scanner:', error);
        showToast('Erro ao iniciar câmera');
        startScanBtn.style.display = 'inline-block';
        stopScanBtn.style.display = 'none';
    }
});

stopScanBtn.addEventListener('click', () => {
    if (scanner) {
        scanner.clear();
        startScanBtn.style.display = 'inline-block';
        stopScanBtn.style.display = 'none';
    }
});

// Copy scanned text
document.getElementById('copyScanBtn').addEventListener('click', () => {
    const text = document.getElementById('scanText').textContent;
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copiado para área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        showToast('Erro ao copiar');
    });
});
