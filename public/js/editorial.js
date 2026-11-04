const search = document.querySelector('#article-search');
const cards = [...document.querySelectorAll('.blog-card[data-category]')];
const filters = [...document.querySelectorAll('[data-filter]')];
let category = 'All';
function updateLibrary() {
    const query = (search?.value || '').trim().toLocaleLowerCase();
    let count = 0;
    cards.forEach(card => {
        const visible = (category === 'All' || card.dataset.category === category)
            && card.textContent.toLocaleLowerCase().includes(query);
        card.hidden = !visible;
        if (visible) count++;
    });
    const status = document.querySelector('#search-status');
    if (status) status.textContent = `${count} ${count === 1 ? 'article' : 'articles'}`;
    const empty = document.querySelector('#no-articles');
    if (empty) empty.hidden = count > 0;
}
search?.addEventListener('input', updateLibrary);
filters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    updateLibrary();
}));
document.querySelectorAll('.article-body pre').forEach(pre => {
    const button = document.createElement('button');
    button.className = 'copy-example';
    button.type = 'button';
    button.textContent = 'Copy example';
    button.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(pre.querySelector('code')?.textContent || '');
            button.textContent = 'Copied';
        } catch { button.textContent = 'Select text to copy'; }
        setTimeout(() => { button.textContent = 'Copy example'; }, 1800);
    });
    pre.insertAdjacentElement('beforebegin', button);
});
