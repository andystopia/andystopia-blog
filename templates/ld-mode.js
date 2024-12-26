const html = document.documentElement;

function userConfigToggle(htmlKey, lookupKey, buttonSelector, toggleFn) { 
  const localStorageValue = localStorage.getItem(lookupKey);

  if (localStorageValue) {
    html.setAttribute(htmlKey, localStorageValue);
  }

  window.addEventListener("load", () => {
    const button = document.querySelector(buttonSelector)
    const localStorageValue = localStorage.getItem(lookupKey) 

    if (localStorageValue) { 
      html.setAttribute(htmlKey, localStorageValue)
    }

    button.addEventListener("click", () => { 
      const destValue = toggleFn(html.getAttribute(htmlKey));
      html.setAttribute(htmlKey, destValue)
      localStorage.setItem(lookupKey, destValue)
    })
  });
}

userConfigToggle("data-theme", "blog-theme", "#light-dark-toggle", 
    (color) => color == "light" ? "dark" : "light"
);

userConfigToggle("data-family", "blog-font", "#font-control", 
    (font) => font == "serif" ? "sans" : "serif"
);

