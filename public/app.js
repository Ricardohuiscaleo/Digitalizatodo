// Detect if mobile
var isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Navigation functionality - solo si no existe
if (typeof window.showSection === 'undefined') {
  window.showSection = function(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
    }
    
    // Update navigation - clear all first
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      item.style.transform = '';
    });
    
    // Set active nav item
    const activeNavItem = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeNavItem) {
      activeNavItem.classList.add('active');
      // Only animate on desktop
      if (!isMobile && !activeNavItem.classList.contains('no-animate')) {
        activeNavItem.style.transform = 'scale(1.15)';
        setTimeout(() => {
          activeNavItem.style.transform = '';
        }, 150);
      }
      activeNavItem.classList.remove('no-animate');
    }
    
    // Update page title for SEO
    const titles = {
      'inicio': 'Digitaliza Todo - Desarrollo de Software y Marketing Digital',
      'servicios': 'Servicios - Digitaliza Todo',
      'proyectos': 'Proyectos - Digitaliza Todo',
      'contacto': 'Contacto - Digitaliza Todo'
    };
    
    if (titles[sectionId]) {
      document.title = titles[sectionId];
    }
  };
}

// Keyboard navigation
document.addEventListener('keydown', function(e) {
  if (e.key === 'Tab') {
    // Allow normal tab navigation
    return;
  }
  
  if (e.key === 'Enter' || e.key === ' ') {
    const focusedElement = document.activeElement;
    if (focusedElement && focusedElement.hasAttribute('data-section')) {
      e.preventDefault();
      const sectionId = focusedElement.getAttribute('data-section');
      showSection(sectionId);
    }
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Set initial active section
  if (typeof window.showSection === 'function') {
    window.showSection('inicio');
  }
  
  if (isMobile) {
    // Mobile: use touch events without zoom effect
    document.querySelectorAll('.nav-item').forEach(item => {
      let touchStartTime = 0;
      let touchStartY = 0;
      
      item.addEventListener('touchstart', function(e) {
        touchStartTime = Date.now();
        touchStartY = e.touches[0].clientY;
      }, { passive: true });
      
      item.addEventListener('touchend', function(e) {
        e.preventDefault();
        const touchDuration = Date.now() - touchStartTime;
        const touchEndY = e.changedTouches[0].clientY;
        const verticalMove = Math.abs(touchEndY - touchStartY);
        
        // Only trigger if it was a tap (not a scroll)
        if (touchDuration < 300 && verticalMove < 10) {
          const sectionId = this.getAttribute('data-section');
          if (sectionId) {
            showSection(sectionId);
          }
        }
      }, { passive: false });
      
      // Remove onclick for mobile
      item.removeAttribute('onclick');
    });
  }
});

// Placeholder functions for header buttons
function toggleNotifications() {
  console.log('Notifications toggled');
}

function toggleMenu() {
  console.log('Menu toggled');
}