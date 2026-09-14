(function() {
  // Chat server URL (use production for all environments during migration)
  const WIDGET_URL = 'https://chat.allmasajid.com';
  const EMBED_URL = WIDGET_URL + '/embed';

  function injectWidget() {
    // Prevent multiple injections
    if (document.getElementById('chat-allmasajid-widget')) return;

    // Create bubble container
    const bubble = document.createElement('div');
    bubble.id = 'chat-allmasajid-bubble';
    bubble.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      z-index: 10000;
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    bubble.innerHTML = '💬';
    bubble.addEventListener('mouseover', () => {
      bubble.style.transform = 'scale(1.1)';
    });
    bubble.addEventListener('mouseout', () => {
      bubble.style.transform = 'scale(1)';
    });

    // Create widget container
    const widget = document.createElement('div');
    widget.id = 'chat-allmasajid-widget';
    widget.style.cssText = `
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 380px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 5px 40px rgba(0,0,0,0.16);
      display: none;
      flex-direction: column;
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Widget header
    const header = document.createElement('div');
    header.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    `;
    header.innerHTML = `
      <span>Chat.allMasajid</span>
      <button style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">×</button>
    `;

    // Close button handler
    const closeBtn = header.querySelector('button');
    closeBtn.addEventListener('click', () => {
      widget.style.display = 'none';
      bubble.style.display = 'flex';
    });

    // iframe
    const iframe = document.createElement('iframe');
    iframe.src = EMBED_URL + '?sid=' + encodeURIComponent(generateSessionId());
    iframe.style.cssText = `
      flex: 1;
      border: none;
      border-radius: 0 0 12px 12px;
    `;

    widget.appendChild(header);
    widget.appendChild(iframe);

    // Bubble click handler
    bubble.addEventListener('click', () => {
      widget.style.display = 'flex';
      bubble.style.display = 'none';
    });

    document.body.appendChild(bubble);
    document.body.appendChild(widget);
  }

  function generateSessionId() {
    const key = 'chat_allmasajid_session';
    let sid = localStorage.getItem(key);
    if (!sid) {
      sid = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(key, sid);
    }
    return sid;
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
  } else {
    injectWidget();
  }
})();
