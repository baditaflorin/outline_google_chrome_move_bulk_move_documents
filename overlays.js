// overlays.js


export function showErrorOverlay(errorMessage) {
    const overlay = document.getElementById('outline-progress-overlay');
    if (overlay) {
        overlay.innerHTML = '';

        // A minimal error icon.
        const errorIcon = document.createElement('div');
        errorIcon.textContent = '✕';
        errorIcon.style.fontSize = '70px';
        errorIcon.style.color = '#555';
        errorIcon.style.animation = 'popIn 0.4s ease-out forwards, shake 0.4s ease-in-out';
        overlay.appendChild(errorIcon);

        const message = document.createElement('div');
        message.textContent = errorMessage || 'Oh no! Something went wrong.';
        message.style.color = '#333';
        message.style.fontSize = '20px';
        message.style.marginTop = '10px';
        message.style.fontFamily = "-apple-system, BlinkMacSystemFont, sans-serif";
        overlay.appendChild(message);

        setTimeout(() => {
            overlay.style.transition = 'transform 0.5s ease-in-out';
            overlay.style.transform = 'scale(0)';
            setTimeout(() => { overlay.remove(); }, 500);
        }, 2500);
    }
}
