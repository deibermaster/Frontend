document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api/products';
    const productosContainer = document.querySelector('.products');
    const loadingMessage = document.createElement('p');
    loadingMessage.textContent = 'Cargando productos...';
    productosContainer.appendChild(loadingMessage);
  
    fetch(API_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al obtener productos');
        }
        return response.json();
      })
      .then(productos => {
        productosContainer.innerHTML = ''; // Limpiar mensaje de carga
        productos.forEach(producto => {
          const productCard = crearTarjetaProducto(producto);
          productosContainer.appendChild(productCard);
        });
      })
      .catch(error => {
        console.error('Error:', error);
        productosContainer.innerHTML = '<p>No se pudieron cargar los productos.</p>';
      })
      .finally(() => {
        loadingMessage.remove();
      });
  });
  
  function crearTarjetaProducto(producto) {
    const productCard = document.createElement('div');
    productCard.classList.add('product-card');
  
    const imagen = producto.image || 'https://via.placeholder.com/150';
    const nombre = producto.name || 'Nombre no disponible';
    const descripcion = producto.description || 'Descripción no disponible';
    const precio = producto.price ? producto.price.toFixed(2) : 'No disponible';
    const fechaFormateada = formatDate(producto.expiration_date);
  
    productCard.innerHTML = `
      <img src="${imagen}" alt="${nombre}">
      <div class="product-info">
        <h3 class="product-title">${nombre}</h3>
        <p class="product-price">Precio: $${precio}</p>
        <p class="product-expiration">Fecha de expiración: ${fechaFormateada}</p>
        <p class="product-description">${descripcion}</p>
        <button class="button ver-detalle">Ver Detalle</button>
      </div>
    `;
  
    const verDetalleButton = productCard.querySelector('.ver-detalle');
    verDetalleButton.addEventListener('click', () => showProductDetails(producto));
  
    return productCard;
  }
  
  // Obtener el rol del usuario desde el token
  function getUserRoleFromToken() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  }
  
  function showProductDetails(product) {
    const modal = document.getElementById('productModal');
    const productDetails = document.getElementById('productDetails');
  
    // Obtener el rol del usuario
    const userRole = getUserRoleFromToken();
  
    // Crear elementos HTML para los detalles del producto
    const image = document.createElement('img');
    image.src = product.image || 'https://via.placeholder.com/300';
    image.alt = product.name;
    image.classList.add('product-detail-image');
  
    const infoDiv = document.createElement('div');
    infoDiv.classList.add('product-detail-info');
  
    const title = document.createElement('h2');
    title.textContent = product.name || 'Nombre no disponible';
    title.classList.add('product-detail-title');
  
    const description = document.createElement('p');
    description.textContent = product.description || 'Descripción no disponible';
    description.classList.add('product-detail-description');
  
    const price = document.createElement('p');
    price.textContent = `Precio: $${product.price ? product.price.toFixed(2) : 'No disponible'}`;
    price.classList.add('product-detail-price');
  
    const expiration = document.createElement('p');
    expiration.textContent = `Fecha de expiración: ${formatDate(product.expiration_date)}`;
    expiration.classList.add('product-detail-expiration');
  
    infoDiv.appendChild(title);
    infoDiv.appendChild(description);
    infoDiv.appendChild(price);
    infoDiv.appendChild(expiration);
  
    // Agregar botón "Añadir al Carrito" o mensaje según el rol del usuario
    if (userRole === 'usuario') {
      const addToCartButton = document.createElement('button');
      addToCartButton.classList.add('carrito');
      addToCartButton.textContent = 'Añadir al Carrito';
      addToCartButton.onclick = () => addToCart(product.id, product.name, product.price, product.image);
      infoDiv.appendChild(addToCartButton);
    } else {
      const loginMessage = document.createElement('p');
      loginMessage.textContent = 'Inicia sesión como usuario para añadir productos al carrito.';
      infoDiv.appendChild(loginMessage);
    }
  
    // Limpiar contenido anterior y agregar los nuevos elementos
    productDetails.innerHTML = '';
    productDetails.appendChild(image);
    productDetails.appendChild(infoDiv);
  
    modal.style.display = 'block';
  }
  
  function formatDate(dateString) {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha no disponible';
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }
  
  // Manejo del cierre del modal
  const modal = document.getElementById('productModal');
  const span = document.querySelector('.close');
  
  span.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // Función para añadir productos al carrito
  function addToCart(id, name, price, image) {
    const token = localStorage.getItem('authToken');
  
    if (!token) {
      alert("Debes iniciar sesión primero.");
      return;
    }
  
    const userRole = getUserRoleFromToken();
    if (userRole !== 'usuario') {
      alert("Debes iniciar sesión como usuario para añadir productos al carrito.");
      return;
    }
  
    if (!name || typeof price !== 'number') {
      alert("Producto inválido. No se puede agregar al carrito.");
      return;
    }
  
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
    const existingProduct = cart.find(item => item.id === id);
    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      cart.push({ id, name, price, image, quantity: 1 });
    }
  
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay(); // Asegúrate de que el carrito se actualice en la interfaz
    alert("Producto añadido al carrito.");
  }
  
  // Función para actualizar el icono del carrito y los productos dentro de él
  function updateCartDisplay() {
    const cartCount = document.querySelector('.cart-count');
    const cartList = document.getElementById('cart-list');
    const cartTotal = document.getElementById('cart-total');
    const cartItems = document.getElementById('cart-items');  // Obtén el contenedor de los productos
  
    if (!cartCount || !cartList || !cartTotal || !cartItems) {
      console.error("Elementos del carrito no encontrados en el DOM.");
      return;
    }
  
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    console.log("Actualizando el carrito. Datos:", cart);
  
    cartList.innerHTML = '';
    let total = 0;
    let totalItems = 0;
  
    cart.forEach((item) => {
      if (!item.name || typeof item.price !== 'number' || item.quantity <= 0) {
        console.warn("Producto inválido omitido:", item);
        return;
      }
  
      const li = document.createElement('li');
  
      const productDiv = document.createElement('div');
      productDiv.classList.add('cart-product');
  
      const productImage = document.createElement('img');
      productImage.src = item.image || 'https://via.placeholder.com/150';
      productImage.alt = item.name;
  
      const productDetails = document.createElement('div');
      productDetails.classList.add('cart-product-details');
  
      const productName = document.createElement('span');
      productName.textContent = `${item.name} x ${item.quantity}`;
  
      const productPrice = document.createElement('span');
      productPrice.classList.add('cart-product-price');
      productPrice.textContent = `$${(item.price * item.quantity).toFixed(2)}`;
  
      productDetails.appendChild(productName);
      productDetails.appendChild(productPrice);
      productDiv.appendChild(productImage);
      productDiv.appendChild(productDetails);
  
      li.appendChild(productDiv);
      cartList.appendChild(li);
  
      total += item.price * item.quantity;
      totalItems += item.quantity;
    });
  
    cartTotal.textContent = `$${total.toFixed(2)}`;
    cartCount.textContent = totalItems;
  
    // Mostrar el contenedor del carrito si hay productos
    if (cart.length > 0) {
      cartItems.style.display = 'block';  // Asegúrate de que el contenedor sea visible
    } else {
      cartItems.style.display = 'none';  // Ocultar si el carrito está vacío
      cartList.innerHTML = '<p>Tu carrito está vacío.</p>';
    }
  }
  




