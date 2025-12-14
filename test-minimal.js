// Minimal test script to verify content script loading
console.log('MINIMAL SFF: Script loaded');

// Add a visible indicator
const indicator = document.createElement('div');
indicator.textContent = 'MINIMAL SFF ACTIVE';
indicator.style.position = 'fixed';
indicator.style.top = '50px';
indicator.style.left = '0';
indicator.style.backgroundColor = 'blue';
indicator.style.color = 'white';
indicator.style.zIndex = '999999';
indicator.style.padding = '10px';
document.body.appendChild(indicator);

console.log('MINIMAL SFF: Indicator added');