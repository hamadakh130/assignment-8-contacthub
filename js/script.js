const $ = (id) => document.getElementById(id);
const overlay = $('overlay'), list = $('contactsList');
const fields = {
  name: $('nameInput'), phone: $('phoneInput'), email: $('emailInput'),
  address: $('addressInput'), group: $('groupInput'), notes: $('notesInput'),
  fav: $('favInput'), em: $('emInput')
};
let contacts = [];
try { contacts = JSON.parse(localStorage.getItem('contacts')) || []; } catch { contacts = []; }
let editingId = null;
let photoData = '';
const save = () => localStorage.setItem('contacts', JSON.stringify(contacts));
const esc = (s = '') => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = (n) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
const avatarHTML = (c) => c.photo ? `<img src="${c.photo}" alt="${esc(c.name)}">` : initials(c.name);
function openModal(contact = null) {
  editingId = contact ? contact.id : null;
  $('modalTitle').textContent = contact ? 'Edit Contact' : 'Add New Contact';
  fields.name.value = contact?.name || '';
  fields.phone.value = contact?.phone || '';
  fields.email.value = contact?.email || '';
  fields.address.value = contact?.address || '';
  fields.group.value = contact?.group || '';
  fields.notes.value = contact?.notes || '';
  fields.fav.checked = !!contact?.fav;
  fields.em.checked = !!contact?.em;
  photoData = contact?.photo || '';
  setPreview();
  overlay.classList.add('show');
}
function closeModal() { overlay.classList.remove('show'); editingId = null; }
function setPreview() {
  $('photoPreview').innerHTML = photoData ? `<img src="${photoData}" alt="">` : '<i class="fa-solid fa-user"></i>';
}
$('openModalBtn').onclick = () => openModal();
$('closeModalBtn').onclick = closeModal;
$('cancelBtn').onclick = closeModal;
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

$('photoInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { photoData = reader.result; setPreview(); };
  reader.readAsDataURL(file);
});
function validate(data) {
  if (!/^[A-Za-z\u0600-\u06FF\s]{3,}$/.test(data.name)) return 'Name must be at least 3 letters (letters only).';
  if (!/^01[0125][0-9]{8}$/.test(data.phone)) return 'Enter a valid Egyptian phone number (e.g., 01012345678).';
  if (contacts.some((c) => c.phone === data.phone && c.id !== editingId)) return 'This phone number already exists.';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return 'Enter a valid email address.';
  return null;
}
$('saveBtn').onclick = () => {
  const data = {
    name: fields.name.value.trim(), phone: fields.phone.value.trim(),
    email: fields.email.value.trim(), address: fields.address.value.trim(),
    group: fields.group.value, notes: fields.notes.value.trim(),
    fav: fields.fav.checked, em: fields.em.checked, photo: photoData
  };
  const error = validate(data);
  if (error) return Swal.fire({ icon: 'error', title: 'Invalid data', text: error, confirmButtonColor: '#7c3aed' });

  if (editingId) {
    contacts = contacts.map((c) => (c.id === editingId ? { ...c, ...data } : c));
    Swal.fire({ icon: 'success', title: 'Updated!', text: 'Contact updated successfully.', timer: 1800, showConfirmButton: false });
  } else {
    contacts.push({ id: Date.now(), ...data });
    Swal.fire({ icon: 'success', title: 'Added!', text: 'Contact added successfully.', timer: 1800, showConfirmButton: false });
  }
  save(); render(); closeModal();
};
function deleteContact(id) {
  Swal.fire({
    title: 'Are you sure?', text: "You won't be able to undo this!", icon: 'warning',
    showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Yes, delete it'
  }).then((r) => {
    if (!r.isConfirmed) return;
    contacts = contacts.filter((c) => c.id !== id);
    save(); render();
    Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Contact has been deleted.', timer: 1500, showConfirmButton: false });
  });
}
function toggle(id, key) {
  contacts = contacts.map((c) => (c.id === id ? { ...c, [key]: !c[key] } : c));
  save(); render();
}
function miniHTML(c) {
  return `<div class="mini"><div class="avatar">${avatarHTML(c)}</div>
    <div><b>${esc(c.name)}</b><small>${esc(c.phone)}</small></div>
    <a href="tel:${esc(c.phone)}"><i class="fa-solid fa-phone"></i></a></div>`;
}
function render() {
  const q = $('searchInput').value.trim().toLowerCase();
  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q));
  list.innerHTML = filtered.length ? filtered.map((c) => `
    <div class="card">
      <div class="avatar">${avatarHTML(c)}</div>
      <div class="info">
        <h4>${esc(c.name)} ${c.group ? `<span class="badge">${esc(c.group)}</span>` : ''}</h4>
        <p><i class="fa-solid fa-phone"></i> ${esc(c.phone)}</p>
        ${c.email ? `<p><i class="fa-solid fa-envelope"></i> ${esc(c.email)}</p>` : ''}
        ${c.address ? `<p><i class="fa-solid fa-location-dot"></i> ${esc(c.address)}</p>` : ''}
        ${c.notes ? `<p><i class="fa-solid fa-note-sticky"></i> ${esc(c.notes)}</p>` : ''}
      </div>
      <div class="actions">
        <a class="act call" href="tel:${esc(c.phone)}" title="Call"><i class="fa-solid fa-phone"></i></a>
        ${c.email ? `<a class="act mail" href="mailto:${esc(c.email)}" title="Email"><i class="fa-solid fa-envelope"></i></a>` : ''}
        <button class="act fav ${c.fav ? 'on' : ''}" onclick="toggle(${c.id},'fav')" title="Favorite"><i class="fa-solid fa-star"></i></button>
        <button class="act em ${c.em ? 'on' : ''}" onclick="toggle(${c.id},'em')" title="Emergency"><i class="fa-solid fa-heart-pulse"></i></button>
        <button class="act" onclick="openModal(contacts.find(x=>x.id===${c.id}))" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button class="act del" onclick="deleteContact(${c.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`).join('') : `
    <div class="no-data"><i class="fa-solid fa-address-book"></i>
      <h3>No contacts found</h3><p>Click "Add Contact" to get started</p></div>`;

  const favs = contacts.filter((c) => c.fav), ems = contacts.filter((c) => c.em);
  $('favList').innerHTML = favs.length ? favs.map(miniHTML).join('') : '<p class="empty">No favorites yet</p>';
  $('emList').innerHTML = ems.length ? ems.map(miniHTML).join('') : '<p class="empty">No emergency contacts</p>';
  $('totalCount').textContent = $('subCount').textContent = contacts.length;
  $('favCount').textContent = favs.length;
  $('emCount').textContent = ems.length;
}

$('searchInput').addEventListener('input', render);
render();