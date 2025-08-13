/* script.js
 - Generates 150 dogs + 150 cats (300 pets) at runtime
 - Implements filters, search, pagination (24 per page)
 - Lazy-loads images and provides a details modal
 - WhatsApp contact links use your number: 2348168441686
*/

// ========== CONFIG ==========
const WHATSAPP_NUMBER = '2348168441686'; // confirmed by you
const PAGE_SIZE = 24; // pets per page
const TOTAL_DOGS = 150;
const TOTAL_CATS = 150;

// Minimal realistic name lists (cycled)
const NAMES = ["Bella","Max","Luna","Charlie","Lucy","Cooper","Nala","Rocky","Milo","Daisy","Bailey","Lola","Buddy","Sadie","Toby","Zoey","Oliver","Maggie","Jack","Sophie","Oscar","Chloe","Leo","Ruby","Jake","Gracie","Bentley","Lilly","Riley","Zoe"];
const DOG_BREEDS = ["Golden Retriever","Bulldog","Labrador","German Shepherd","Beagle","Poodle","Rottweiler","Boxer","Dachshund","Siberian Husky","Doberman","Chow Chow","Pomeranian","Shiba Inu","Great Dane"];
const CAT_BREEDS = ["Persian","Siamese","Maine Coon","Ragdoll","Bengal","Sphynx","Scottish Fold","British Shorthair","American Shorthair","Abyssinian","Norwegian Forest Cat","Oriental","Birman","Exotic Shorthair","Turkish Angora"];

function randFrom(arr, i) { return arr[i % arr.length]; }
function priceFor(action){ // adopt must be >=500, buy >=250
  if(action === 'adopt') return 500 + Math.floor(Math.random()*501); // 500-1000
  return 250 + Math.floor(Math.random()*751); // 250-1000
}
function ageText(){
  const months = Math.floor(Math.random()*36) + 2;
  if(months < 12) return `${months} months`;
  const years = Math.floor(months/12);
  return `${years} yr${years>1?'s':''}`;
}

// Build PETS array dynamically
const PETS = [];
let counter = 1;
for(let i=0;i<TOTAL_DOGS;i++){
  const name = randFrom(NAMES, i) + (Math.random()<0.2 ? ` ${['Jr.','II','III'][i%3]}` : '');
  const breed = randFrom(DOG_BREEDS, i);
  const action = Math.random() < 0.55 ? 'buy' : 'adopt'; // more buys slightly
  const price = priceFor(action);
  const pet = {
    id: `dog${i+1}`,
    name,
    type: 'dog',
    action,
    breed,
    age: ageText(),
    price,
    img: `https://source.unsplash.com/800x600/?dog&sig=${i+1}`,
    desc: `${name} is a ${breed.toLowerCase()} — ${Math.random()<0.6 ? 'Playful and good with families.' : 'Calm, well-trained, and affectionate.'}`
  };
  PETS.push(pet);
  counter++;
}
for(let i=0;i<TOTAL_CATS;i++){
  const name = randFrom(NAMES, i+10) + (Math.random()<0.18 ? ` ${['Bella','Luna','Milo'][i%3]}` : '');
  const breed = randFrom(CAT_BREEDS, i);
  const action = Math.random() < 0.5 ? 'adopt' : 'buy'; // more adopts slightly for cats
  const price = priceFor(action);
  const pet = {
    id: `cat${i+1}`,
    name,
    type: 'cat',
    action,
    breed,
    age: ageText(),
    price,
    img: `https://source.unsplash.com/800x600/?cat&sig=${i+1}`,
    desc: `${name} is a ${breed.toLowerCase()} — ${Math.random()<0.5 ? 'Affectionate and indoor-friendly.' : 'Playful and curious, great companion.'}`
  };
  PETS.push(pet);
  counter++;
}

// Testimonials (kept small)
const TESTIMONIALS = [
  { quote: "Brian Petstore made finding our golden retriever so easy. Excellent service and follow-up.", name: "Sarah M., New York", img: "https://randomuser.me/api/portraits/women/68.jpg" },
  { quote: "Amazing process. Healthy pets and wonderful staff. Our Bella is now family.", name: "James L., California", img: "https://randomuser.me/api/portraits/men/32.jpg" },
  { quote: "They were professional and transparent. Highly recommended for first-time adopters.", name: "Olivia R., Texas", img: "https://randomuser.me/api/portraits/women/45.jpg" }
];

// ========== DOM refs ==========
const petsGrid = document.getElementById('pets-grid');
const filterType = document.getElementById('filter-type');
const filterAction = document.getElementById('filter-action');
const searchInput = document.getElementById('search');
const petModal = document.getElementById('pet-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const testiTrack = document.getElementById('testi-track');
const testiPrev = document.getElementById('testi-prev');
const testiNext = document.getElementById('testi-next');
const whatsappMain = document.getElementById('whatsapp-main');
const footerWhatsapp = document.getElementById('footer-whatsapp');
const yearSpan = document.getElementById('year');
const paginationEl = document.getElementById('pagination');

let currentPage = 1;
let filteredList = PETS.slice(); // start with all

// ========== Helpers ==========
function whatsappUrl(number, text){ return `https://wa.me/${number}?text=${encodeURIComponent(text)}`; }

function petCardHtml(p){
  const tag = p.action === 'buy' ? `<span class="badge badge-buy">BUY</span>` : `<span class="badge badge-adopt">ADOPT</span>`;
  return `
    <article class="pet" data-id="${p.id}" tabindex="0" aria-label="${p.name} card">
      <img src="${p.img}" alt="${p.name}" loading="lazy" />
      <div class="pet-body">
        <div class="pet-title">
          <h3>${p.name}</h3>
          ${tag}
        </div>
        <p class="muted">${p.breed} • ${p.age}</p>
        <p class="price">$${p.price}</p>
        <div class="pet-actions">
          <button class="btn" data-action="details" data-id="${p.id}">View</button>
          <a class="btn" href="${whatsappUrl(WHATSAPP_NUMBER, `Hi, I'm interested in ${p.name} (${p.breed}) listed for ${p.action} at $${p.price}. Is it available?`)}" target="_blank" rel="noopener">Contact</a>
        </div>
      </div>
    </article>
  `;
}

function renderPets(){
  const q = (searchInput.value || '').toLowerCase().trim();
  const type = filterType.value;
  const action = filterAction.value;

  filteredList = PETS.filter(p => {
    if(type !== 'all' && p.type !== type) return false;
    if(action !== 'all' && p.action !== action) return false;
    if(action === 'buy' && p.price < 250) return false;
    if(action === 'adopt' && p.price < 500) return false;
    if(q && !(p.name.toLowerCase().includes(q) || p.breed.toLowerCase().includes(q))) return false;
    return true;
  });

  currentPage = 1;
  renderPage();
}

function renderPage(){
  const start = (currentPage-1)*PAGE_SIZE;
  const pageItems = filteredList.slice(start, start + PAGE_SIZE);
  petsGrid.innerHTML = pageItems.map(petCardHtml).join('');
  attachCardEvents();
  renderPagination();
  // lazy images handled by loading="lazy"
}

function renderPagination(){
  const count = Math.ceil(filteredList.length / PAGE_SIZE);
  const pagesToShow = Math.min(count, 9);
  let html = '';
  if(count <= 1){ paginationEl.innerHTML = ''; return; }
  if(currentPage > 1) html += `<button class="page-btn" data-page="${currentPage-1}">Prev</button>`;
  // simple logic for pages around current
  const start = Math.max(1, currentPage - Math.floor(pagesToShow/2));
  const end = Math.min(count, start + pagesToShow - 1);
  for(let i=start;i<=end;i++){
    html += `<button class="page-btn ${i===currentPage?'active':''}" data-page="${i}">${i}</button>`;
  }
  if(currentPage < count) html += `<button class="page-btn" data-page="${currentPage+1}">Next</button>`;
  paginationEl.innerHTML = html;
  paginationEl.querySelectorAll('.page-btn').forEach(b=>{
    b.addEventListener('click', ()=> {
      const p = Number(b.getAttribute('data-page'));
      if(!isNaN(p)) { currentPage = p; renderPage(); window.scrollTo({top: 320, behavior:'smooth'}); }
    });
  });
}

// Attach card events
function attachCardEvents(){
  document.querySelectorAll('[data-action="details"]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const id = btn.getAttribute('data-id');
      openModal(id);
    });
  });
  document.querySelectorAll('.pet').forEach(card=>{
    card.addEventListener('keydown', e=>{
      if(e.key === 'Enter') openModal(card.getAttribute('data-id'));
    });
  });
}

// Modal
function openModal(id){
  const p = PETS.find(x=>x.id===id);
  if(!p) return;
  modalBody.innerHTML = `
    <div style="display:flex; gap:0; flex-wrap:wrap;">
      <div class="modal-left"><img src="${p.img}" alt="${p.name}"></div>
      <div class="modal-right">
        <h2 style="margin-top:0">${p.name} <small style="color:var(--muted); font-weight:600">• ${p.breed}</small></h2>
        <p style="color:var(--muted)">${p.desc}</p>
        <p style="font-weight:800; color:var(--blue-700)">$${p.price} — ${p.action.toUpperCase()}</p>
        <p style="margin-top:12px"><strong>Age:</strong> ${p.age}</p>
        <div style="margin-top:18px; display:flex; gap:10px; flex-wrap:wrap;">
          <a href="${whatsappUrl(WHATSAPP_NUMBER, `Hello, I'm interested in ${p.name} (${p.breed}) for ${p.action} at $${p.price}.`)}" target="_blank" class="btn-primary">Contact on WhatsApp</a>
          <button id="modal-close-cta" class="btn-ghost" style="border-radius:10px">Close</button>
        </div>
      </div>
    </div>
  `;
  petModal.classList.add('show');
  petModal.setAttribute('aria-hidden','false');
  const closeBtn = document.getElementById('modal-close-cta');
  if(closeBtn) closeBtn.addEventListener('click', closeModal);
}

// close
function closeModal(){
  petModal.classList.remove('show');
  petModal.setAttribute('aria-hidden','true');
  modalBody.innerHTML = '';
}
document.getElementById('modal-close').addEventListener('click', closeModal);
petModal.addEventListener('click', (e)=> { if(e.target === petModal) closeModal(); });

// Testimonials
function renderTestimonials(){
  testiTrack.innerHTML = TESTIMONIALS.map(t => `
    <div class="testi-item">
      <p>"${t.quote}"</p>
      <div class="who">
        <img src="${t.img}" alt="${t.name}">
        <div><strong>${t.name}</strong></div>
      </div>
    </div>
  `).join('');
}
let currentTesti = 0;
function showTesti(index){
  const items = testiTrack.children;
  if(!items.length) return;
  if(index < 0) index = items.length-1;
  if(index >= items.length) index = 0;
  currentTesti = index;
  testiTrack.style.transform = `translateX(-${index * 100}%)`;
}
testiPrev.addEventListener('click', ()=> showTesti(currentTesti -1));
testiNext.addEventListener('click', ()=> showTesti(currentTesti +1));
setInterval(()=> showTesti(currentTesti +1), 6000);

// contact form -> whatsapp
document.getElementById('contact-send').addEventListener('click', ()=>{
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const msg = document.getElementById('message').value.trim();
  if(!name || !phone) { alert('Please enter name and phone'); return; }
  const text = `Hi, I'm ${name} (${phone}). ${msg}`;
  window.open(whatsappUrl(WHATSAPP_NUMBER, text), '_blank');
});

// filters
filterType.addEventListener('change', renderPets);
filterAction.addEventListener('change', renderPets);
searchInput.addEventListener('input', debounce(renderPets, 250));

// simple debounce
function debounce(fn, wait){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), wait); }; }

// init
function init(){
  renderPets();
  renderTestimonials();
  showTesti(0);
  whatsappMain.href = whatsappUrl(WHATSAPP_NUMBER, 'Hello, I would like to know more about Brian Petstore');
  footerWhatsapp.href = whatsappUrl(WHATSAPP_NUMBER, 'Hello');
  yearSpan.textContent = new Date().getFullYear();
}
init();
