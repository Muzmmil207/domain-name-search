(async () => {
    let domains = [];

    document.getElementById('js-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        document.querySelectorAll('.domain').forEach(element => {
            element.href = '#';
            element.classList.remove('domain-taken', 'domain-free');
        });

        nameToCheck = document.getElementById('js-name').value.trim();

        if (nameToCheck.length < 1) {
            return;
        }

        nameToCheck = punycode.toASCII(nameToCheck);

        const queue = [...domains];

        const queueNext = () => {
            const nextDomain = queue.shift();

            if (nextDomain) {
                fetchDomain(nextDomain);
            }
        };

        const fetchDomain = (domain) => {
            fetch(`https://cloudflare-dns.com/dns-query?type=SOA&name=${nameToCheck}.${domain}.`,
                {
                    headers:
                    {
                        Accept: 'application/dns-json'
                    }
                })
                .then(response => response.json())
                .then(response => {
                    let hasSOA = false;

                    if (response.Answer) {
                        hasSOA = response.Answer.some(record => record.type === 6);
                    }

                    const element = document.getElementById(`tld-${domain}`);
                    element.classList.add(hasSOA ? 'domain-taken' : 'domain-free');

                    if (hasSOA) {
                        element.href = `http://${nameToCheck}.${domain}`;
                    } else {
                        element.href = `https://www.namesilo.com/domain/search-domains?rid=a5c8971os&query=${nameToCheck}.${domain.toLowerCase()}`;
                    }

                    queueNext();
                })
                .catch(error => {
                    queueNext();
                    console.log(domain, error);
                });
        };

        for (let i = 0; i < 10; i++) {
            queueNext();
        }
    });

    domainsFetch = await fetch('https://data.iana.org/TLD/tlds-alpha-by-domain.txt');
    domainsFetch = await domainsFetch.text();
    domains = domainsFetch.trim().split('\n');
    domainsFetch = null;

    document.getElementById('js-iana-version').appendChild(document.createTextNode(domains.shift().substring(2) + '.'));

    domains.sort((a, b) => {
        if (a.length === b.length) {
            return 0;
        }

        return a.length - b.length;
    });

    let allDomains = '';

    for (const domain of domains) {
        let displayName = domain.toLowerCase();
        displayName = displayName.startsWith('xn--') ? punycode.toUnicode(displayName.toLowerCase()) : displayName;

        allDomains += `<a href="#" target="_blank" rel="noopener" class="domain" id="tld-${domain}">.${displayName}</a> `;
    }

    document.getElementById('domains').innerHTML = allDomains;
})();