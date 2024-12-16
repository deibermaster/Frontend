document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:3000/api/products';
  const productosContainer = document.querySelector('.products');
  const authButtons = document.getElementById('auth-buttons');
  const profileSection = document.getElementById('profile-section');
  const logoutButton = document.getElementById('logout-button');
  const cartIcon = document.getElementById('cart-icon');
  const cartContainer = document.getElementById('cart-items');
  const closeCartBtn = cartContainer.querySelector('.close-cart');
  const cartList = document.getElementById('cart-list');
  const cartTotal = document.getElementById('cart-total');
  const cartCount = document.querySelector('.cart-count');
  const modal = document.getElementById('productModal');
  const productDetails = document.getElementById('productDetails');


  // Mostrar botones según el estado de autenticación
  function updateAuthState() {
      const token = localStorage.getItem('authToken');
      if (token) {
          authButtons.style.display = 'none';
          profileSection.style.display = 'flex';
      } else {
          authButtons.style.display = 'flex';
          profileSection.style.display = 'none';
      }
  }

  // Obtener rol del usuario desde el token
  function getUserRoleFromToken() {
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
  }

  // Mostrar productos
  fetch(API_URL)
      .then(response => {
          if (!response.ok) {
              throw new Error('Error al obtener productos');
          }
          return response.json();
      })
      .then(productos => {
          productosContainer.innerHTML = ''; // Limpiar productos existentes
          productos.forEach(producto => {
              const productCard = crearTarjetaProducto(producto);
              productosContainer.appendChild(productCard);
          });
      })
      .catch(error => {
          console.error('Error:', error);
          productosContainer.innerHTML = '<p>No se pudieron cargar los productos.</p>';
      });

  // Crear tarjeta de producto
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

      // Mostrar "Añadir al carrito" solo para usuarios con rol `usuario`
      const userRole = getUserRoleFromToken();
      if (userRole === 'usuario') {
          const addToCartButton = document.createElement('button');
          addToCartButton.classList.add('button', 'carrito');
          addToCartButton.textContent = 'Añadir al Carrito';
          addToCartButton.onclick = () => addToCart(producto.id, nombre, producto.price, imagen);
          productCard.querySelector('.product-info').appendChild(addToCartButton);
      }

      return productCard;
  }

  // Mostrar detalles del producto
  function showProductDetails(product) {
    const token = localStorage.getItem('authToken');
    const userRole = getUserRoleFromToken();
  
    productDetails.innerHTML = `
      <div class="modal-content"> 
        <span class="close-button">&times;</span> <img src="${product.image || 'https://via.placeholder.com/300'}" alt="${product.name}" class="product-detail-image">
        <div class="product-detail-info">
          <h2 class="product-detail-title">${product.name || 'Nombre no disponible'}</h2>
          <p class="product-detail-description">${product.description || 'Descripción no disponible'}</p>
          <p class="product-detail-price">Precio: $${product.price ? product.price.toFixed(2) : 'No disponible'}</p>
          <p class="product-detail-expiration">Fecha de expiración: ${formatDate(product.expiration_date)}</p>
        </div>
      </div>
    `;
  
    const detailInfo = productDetails.querySelector('.product-detail-info');
    const modalContent = productDetails.querySelector('.modal-content'); // Selecciona el contenido del modal
  
    if (token && userRole === 'usuario') {
      // Si está logueado y tiene rol "usuario", mostrar botón "Añadir al carrito"
      const addToCartButton = document.createElement('button');
      addToCartButton.classList.add('button', 'carrito');
      addToCartButton.textContent = 'Añadir al Carrito';
      addToCartButton.onclick = () => addToCart(product.id, product.name, product.price, product.image);
      detailInfo.appendChild(addToCartButton);
    } else {
      // Si no está logueado, mostrar mensaje de inicio de sesión
      const loginMessage = document.createElement('p');
      loginMessage.classList.add('login-message');
      loginMessage.textContent = 'Inicia sesión para añadir productos al carrito.';
      detailInfo.appendChild(loginMessage);
    }
  
    // Agregar evento para cerrar el modal al hacer clic en la "x"
    const closeButton = productDetails.querySelector('.close-button');
    closeButton.onclick = () => {
      modal.style.display = 'none'; 
    }
  
    modal.style.display = 'block';
  }

  // Formatear fechas
  function formatDate(dateString) {
      if (!dateString) return 'Fecha no disponible';
      const date = new Date(dateString);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  // Añadir productos al carrito
  function addToCart(productId, productName, productPrice, productImage) {
    const token = localStorage.getItem('authToken');

    if (!token) {
        alert('Debe iniciar sesión para añadir productos al carrito.');
        return;
    }

    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    cartItems.push({ id: productId, name: productName, price: productPrice, image: productImage });
    localStorage.setItem('cartItems', JSON.stringify(cartItems));

    // Actualiza la interfaz
    renderCart();
    updateCartCount(cartItems.length);

    alert(`${productName} se añadió al carrito.`);
}

function renderCart() {
  const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
  const cartList = document.querySelector('#cart-list'); 
  const cartTotal = document.querySelector('#cart-total'); 

  cartList.innerHTML = '';
  let total = 0;

  cartItems.forEach(item => {
    total += item.price;
    const listItem = document.createElement('li');

    // Crear elementos para la imagen, nombre y precio
    const img = document.createElement('img');
    img.src = item.image || 'https://via.placeholder.com/50'; // Imagen del producto o placeholder
    img.alt = item.name;
    img.classList.add('cart-item-image'); // Agregar una clase para el estilo

    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${item.name} - $${item.price.toFixed(2)}`;

    // Agregar los elementos al listItem
    listItem.appendChild(img);
    listItem.appendChild(nameSpan);

    cartList.appendChild(listItem);
  });

  cartTotal.textContent = total.toFixed(2);
}

cartIcon.addEventListener('click', () => {
  // Alternar la visibilidad del carrito
  if (cartContainer.style.display === 'none' || cartContainer.style.display === '') {
    renderCart(); // Actualizar el carrito antes de mostrarlo
    cartContainer.style.display = 'block';
  } else {
    cartContainer.style.display = 'none';
  }
});

  // Actualizar el carrito
  function updateCartDisplay() {
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      cartList.innerHTML = '';
      let total = 0;

      cart.forEach(item => {
          const li = document.createElement('li');
          li.textContent = `${item.name} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`;
          cartList.appendChild(li);
          total += item.price * item.quantity;
      });

      cartTotal.textContent = total.toFixed(2);
      cartCount.textContent = cart.length;
      cartContainer.style.display = cart.length > 0 ? 'block' : 'none';
  }

  // Manejo del cierre del carrito
  closeCartBtn.addEventListener('click', () => {
      cartContainer.style.display = 'none';
  });

  // Cerrar sesión
  logoutButton.addEventListener('click', () => {
      localStorage.removeItem('authToken');
      alert('Has cerrado sesión.');
      location.reload(); // Recargar la página
  });

  // Inicializar el estado
  updateAuthState();
  updateCartDisplay();
});


// Verifica si el usuario está logueado al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const cartList = document.querySelector('#cart-list');

  if (!token) {
      // Si no hay sesión activa, limpiar el localStorage y el carrito
      localStorage.clear();
      cartList.innerHTML = '';
      updateCartCount(0);
      console.log('El carrito y la sesión se han reseteado al cargar la página.');
  } else {
      // Renderizar el carrito si el usuario está logueado
      renderCart();
  }
});


document.querySelector('#logout-button').addEventListener('click', () => {
  // Elimina el token y resetea el carrito
  localStorage.removeItem('authToken');
  localStorage.removeItem('cartItems');

  // Limpia la interfaz del carrito
  const cartList = document.querySelector('#cart-list');
  cartList.innerHTML = '';
  updateCartCount(0);

  // Notifica al usuario
  alert('Se cerró la sesión y el carrito se ha vaciado.');

  // Redirige al usuario a la página de inicio
  window.location.href = '/';
});

// Actualizar el contador del carrito
function updateCartCount(count) {
  const cartCount = document.querySelector('.cart-count');
  cartCount.textContent = count;
}








