document.addEventListener("readystatechange", () => {
    if (document.readyState !== "complete") {
        return;
    }
    const options = {};

    let link = null;
    let elem = null;

    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                elem = entry.target;
            }
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

    for (const element of document.querySelector("main .document").querySelectorAll(":scope>:is(h1,h2,h3)")) {
        observer.observe(element);
    }
});
