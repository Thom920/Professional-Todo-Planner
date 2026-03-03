// ===== VALIDATION FUNCTIES =====
// Toon een error message bij een input veld
export function showError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const errorDiv = document.getElementById(errorId);
    input.classList.add('input-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Verberg error message bij een input veld
export function hideError(inputId, errorId) {
    const input = document.getElementById(inputId);
    const errorDiv = document.getElementById(errorId);
    input.classList.remove('input-error');
    errorDiv.style.display = 'none';
}
