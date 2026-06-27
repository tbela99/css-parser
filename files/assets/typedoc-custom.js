document.addEventListener("readystatechange", () => {
    if (document.readyState !== "complete") {
        return;
    }
    const options = {
        threshold: 0.4,
    };

    let link = null;
    let elem = null;

    document.body.addEventListener("click", (e) => {
        if (e.target.matches("a.page-content-anchor-link")) {
            if (link != null && link !== e.target) {
                link.classList.remove("is-active");
                link = e.target;
                link.classList.add("is-active");
            }
        }
    });

    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                elem = entry.target;
                break;
            }
        }

        while (elem != null && elem.tagName !== "H1" && elem.tagName !== "H2" && elem.tagName !== "H3") {
            elem = elem.previousElementSibling;
        }

        if (elem != null) {
            const newLink = document.querySelector('a[href="#' + elem.id + '"]');

            if (link !== null) {
                link.classList.remove("is-active");
            }
            link = newLink;
            link.classList.add("is-active");
        }
    }, options);

    for (const element of document.querySelector("main .document").querySelectorAll(":scope>:is(h1,h2,h3,p,pre)")) {
        observer.observe(element);
    }
});
