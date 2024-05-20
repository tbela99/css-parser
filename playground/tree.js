function clickHandler(event) {

    if (event.target.classList.contains('e') || event.target.tagName === 'A') {

        const parentLi = event.target.closest('li');

        if (parentLi != null) {

            event.preventDefault();
            parentLi.classList.toggle('tree-collapsed');

        }
    }
}

// Función para construir el árbol

export function buildTree(treeElement, jsonObj, options) {

    treeElement.innerHTML = "";

    const isArray = Array.isArray(jsonObj);
    const isObject = typeof jsonObj === 'object' && !isArray;

    let openKey = '{';

    let closeKey = '}';

    if (isArray) {

        openKey = '[';
        closeKey = ']';

    } else if (isObject) {

        openKey = '{';
        closeKey = '}';
    }

    treeElement.removeEventListener('click', clickHandler);
    treeElement.addEventListener('click', clickHandler);

    treeElement.innerHTML = `<ul><li data-key=''>
        <span class="e"></span>
        ${options?.rootName ? `
<span class="token property">${options.rootName}</span>
        <span class="token operator">: </span>` : ''}
        <span class="token punctuation">${openKey}</span>
        <span class="tree-more-dots"> ... </span>
        <span class="token punctuation">${closeKey}</span>
   `;

    treeElement.firstElementChild.querySelector('.tree-more-dots').insertAdjacentElement('afterend', createTreeDom(jsonObj, '', options));

    treeElement.firstElementChild.addEventListener('click', (event) => {

        const target = event.target.parentElement;
        if (target.matches('li[data-parsed=no]')) {

            const node = target.querySelector(':scope>.tree-more-dots');

            if (node == null) {
                return;
            }

            node.insertAdjacentElement('afterend', createTreeDom(jsonObj, target.dataset.key, options));
            target.removeAttribute('data-parsed');
        }
    })
}

// Función para crear el DOM del árbol

function createTreeDom(obj, key, options) {

    const path = [];

    if (key !== '' && key !== null) {

        path.push(...JSON.parse(key));

        for (const pathKey of path) {

            obj = obj[pathKey];

            if (obj == null) {

                return;
            }
        }
    }

    // Obtenemos las claves del objeto en un array

    const keys = Object.keys(obj);
    const ul = document.createElement("ul");

    for (let i = 0; i < keys.length; i++) {

        const key = keys[i];

        const li = document.createElement("li");

        li.classList.add("tree-collapsed");
        li.dataset.key = JSON.stringify([...path, key]);
        li.dataset.parsed = 'no';

        const child = obj[key];

        const childTypeof = typeof child;

        const {name, value} = options?.transform(key, child, obj) ?? {name: key, value: child};

        if (childTypeof === "object" && child != null) {

            if (Object.keys(child).length === 0) {

                li.innerHTML = `<span class="token property">${name}</span>
                <span class="token operator">: </span>
                <span class="token punctuation">{</span>
                <span class="tree-more-dots"> ... </span>
                <span class="token punctuation">${i < keys.length - 1 ? "}," : "}"}</span>
                `;

            } else {

                const objectIsArray = Array.isArray(obj);
                const childIsArray = Array.isArray(child);

                const openKey = childIsArray ? '[' : '{';
                const closeKey = childIsArray ? ']' : '}';

                if (objectIsArray) {

                    li.innerHTML = `<span class="e"></span>
                                    <span class="token property">${name}</span>
                                    <span class="token operator">: </span>
                                    <a href="#" class="token punctuation">${openKey}</a>
                                    <span class="tree-more-dots"> ... </span>
                    `;

                } else {

                    li.innerHTML = `<span class="e"></span>
                    <span class="token property">${key}</span>
                     <span class="token operator">: </span>
                     <a href="#" class="token punctuation">${openKey}</a>          
                    <span class="tree-more-dots"> ... </span>
                    `;
                }

                li.innerHTML += `<span class="token punctuation">${closeKey}${i < keys.length - 1 ? "," : ''}</span>
                `;
            }

        } else {

            li.innerHTML = `${name === '' ? '' : `<span class="token property">${name}</span>
            <span class="token operator">: </span>
            `}
            <span class="token childTypeof${child === null ? 'null' : ''}">${value}</span>
                `;

            // Agregamos la coma solo si no es el último elemento

            if (i < keys.length - 1) {

                li.innerHTML += ",";
            }
        }

        ul.appendChild(li);
    }

    return ul;
}
