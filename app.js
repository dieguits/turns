const MAX = 10;

// Each entry: { id, name, versiculo, sortNumber, done }
let people = [];
let nextId = 1;

const addBtn     = document.getElementById('addBtn');
const clearBtn   = document.getElementById('clearBtn');
const cardList   = document.getElementById('cardList');
const listHeader = document.getElementById('listHeader');
const counter    = document.getElementById('counter');
const emptyState = document.getElementById('emptyState');

addBtn.addEventListener('click', addPerson);
clearBtn.addEventListener('click', clearNumbers);

function addPerson() {
  if (people.length >= MAX) return;

  people.push({ id: nextId++, name: '', versiculo: '', sortNumber: null, done: false });
  render();

  // Auto-focus the new name field
  const inputs = cardList.querySelectorAll('.input-name');
  inputs[inputs.length - 1].focus();
}

function clearNumbers() {
  people.forEach(p => { p.versiculo = ''; p.sortNumber = null; p.done = false; });
  sortAndRender();
}

function toggleDone(id) {
  const person = people.find(p => p.id === id);
  if (person) {
    person.done = !person.done;
    render();
  }
}

function removePerson(id) {
  people = people.filter(p => p.id !== id);
  render();
}

function onNameChange(id, value) {
  const person = people.find(p => p.id === id);
  if (person) {
    person.name = value.trim();
    sortAndRender();
  }
}

function formatVersiculo(raw) {
  // Normalize: replace spaces between digits with ", " then clean up extra commas/spaces
  return raw
    .trim()
    .replace(/\s*,\s*/g, ', ')          // normalize existing commas
    .replace(/(\d)\s+(\d)/g, '$1, $2')  // space between numbers → ", "
    .replace(/,\s*$/, '')               // trailing comma
    .replace(/^,\s*/, '');              // leading comma
}

function onVersiculoChange(id, rawValue) {
  const person = people.find(p => p.id === id);
  if (!person) return;

  const formatted = formatVersiculo(rawValue);
  person.versiculo = formatted;

  // Sort by the first number in the string
  const firstMatch = formatted.match(/\d+(\.\d+)?/);
  person.sortNumber = firstMatch ? parseFloat(firstMatch[0]) : null;

  sortAndRender();

  // Update the input to show the formatted value
  const input = document.querySelector(`.card[data-id="${id}"] .input-number`);
  if (input) input.value = formatted;
}

function sortAndRender() {
  const hasNumbers = people.some(p => p.sortNumber !== null);

  if (!hasNumbers) {
    // No numbers assigned — sort alphabetically by name, unnamed go to the end
    people.sort((a, b) => {
      if (!a.name && !b.name) return 0;
      if (!a.name) return 1;
      if (!b.name) return -1;
      return a.name.localeCompare(b.name);
    });
  } else {
    // Sort by all numbers in sequence; unnumbered go to the end
    people.sort((a, b) => {
      if (a.sortNumber === null && b.sortNumber === null) return 0;
      if (a.sortNumber === null) return 1;
      if (b.sortNumber === null) return -1;

      const numsA = (a.versiculo.match(/\d+(\.\d+)?/g) || []).map(Number);
      const numsB = (b.versiculo.match(/\d+(\.\d+)?/g) || []).map(Number);
      const len = Math.max(numsA.length, numsB.length);

      for (let i = 0; i < len; i++) {
        const na = i < numsA.length ? numsA[i] : -Infinity;
        const nb = i < numsB.length ? numsB[i] : -Infinity;
        if (na !== nb) return na - nb;
      }
      return 0;
    });
  }

  render(true);
}

function render(sorted = false) {
  // Sync counter and button state
  counter.textContent = `${people.length} / ${MAX}`;
  addBtn.disabled = people.length >= MAX;
  clearBtn.disabled = !people.some(p => p.versiculo !== '');

  // Toggle empty state and column header
  emptyState.classList.toggle('hidden', people.length > 0);
  listHeader.classList.toggle('hidden', people.length === 0);

  // Rebuild the list
  cardList.innerHTML = '';

  people.forEach((person, index) => {
    const card = document.createElement('div');
    card.className = ['card', sorted ? 'sorted' : '', person.done ? 'done' : ''].filter(Boolean).join(' ');
    card.dataset.id = person.id;

    const badge = document.createElement('div');
    badge.className = 'badge' + (index === 0 && person.sortNumber !== null ? ' top' : '');
    badge.textContent = index + 1;

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'input-name';
    nameInput.placeholder = `Persona ${index + 1}`;
    nameInput.value = person.name;
    nameInput.maxLength = 40;
    nameInput.addEventListener('blur', e => onNameChange(person.id, e.target.value));

    const numberInput = document.createElement('input');
    numberInput.type = 'text';
    numberInput.inputMode = 'decimal';
    numberInput.className = 'input-number';
    numberInput.placeholder = 'Vers.';
    numberInput.value = person.versiculo;
    numberInput.addEventListener('blur', e => onVersiculoChange(person.id, e.target.value));

    const checkBtn = document.createElement('button');
    checkBtn.className = 'btn-check' + (person.done ? ' checked' : '');
    checkBtn.title = person.done ? 'Marcar como pendiente' : 'Marcar como listo';
    checkBtn.textContent = '✓';
    checkBtn.addEventListener('click', () => toggleDone(person.id));

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.title = 'Eliminar';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => removePerson(person.id));

    card.appendChild(badge);
    card.appendChild(nameInput);
    card.appendChild(numberInput);
    card.appendChild(checkBtn);
    card.appendChild(removeBtn);
    cardList.appendChild(card);
  });
}

// Initial render
render();
