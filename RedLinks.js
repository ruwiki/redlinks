function RedLinks (mediaWiki, links) {
    this.links = links||{};
    this.mw = mediaWiki;
}

RedLinks.prototype.parseRedLinks = function(doc) {
    this.links = {};
    var redLinks = doc.querySelectorAll('span[data-interwiki-lang]');
    for (var i = 0; i < redLinks.length; ++i) {
        if (redLinks[i].childElementCount != 1) continue;
        var host = redLinks[i].getAttribute('data-interwiki-lang');
        if (host === 'd') {
            host = ''; // wikidata
        } else {
            host += '.wikipedia.org';
        }
        var title = redLinks[i].getAttribute('data-interwiki-article');
        if ( redLinks[i].children[0].className !== 'new' ) {
            continue;
        }
        if (!this.links[host]) this.links[host] = {};
        if (!this.links[host][title]) this.links[host][title] = [];
        this.links[host][title].push(redLinks[i].children[0]);
    }
};

RedLinks.upgradeLinks = function(links, qid) {
    for (var i = 0; i < (links||[]).length; i++) {
        links[i].href += '&editintro=T:Нет_статьи/editintro&veswitched=0&from='+qid;
    }
};

RedLinks.apiGet = function(api, params, sleep, callback) {
    setTimeout(function() {
        api.get(params).done(function(response) { callback(response);});
    }, sleep);        
};

RedLinks.prototype.callApiMethod = function(signature, callback) {
    if (!signature || !Object.keys(signature)[0]) return;
    var dataKey = Object.keys(signature)[0];
    for (var host in this.links) {
        if (!host || !this.links[host]) continue;
        var api = new this.mw.ForeignApi('//' + host + '/w/api.php', { anonymous: true});
        for (var start = 0; start < Object.keys(this.links[host]).length; start += 50) {
            var params = {};
            Object.assign(params, signature);
            params[dataKey] = Object.keys(this.links[host]).slice(start, start+50).join('|');
            RedLinks.apiGet(api, params, start, callback);
        }
    }
};

RedLinks.prototype.processQueryResponse = function(response) {
    if (!response || !response.query || !response.query.general) return;
    var langLinks = this.links[response.query.general.servername];
    if (!langLinks) return;
    
    var backlinks = {};
    for (var i = 0; i < (response.query.redirects||[]).length; i++) {
        backlinks[response.query.redirects[i].to] = response.query.redirects[i].from;
    }
    for (var i = 0; i < (response.query.normalized||[]).length; i++) {
        backlinks[response.query.normalized[i].to] = response.query.normalized[i].from;
    }
        
    for (var id in response.query.pages) {
        if (!('pageprops' in response.query.pages[id])) continue;
        var title = backlinks[response.query.pages[id].title] ? 
                    backlinks[response.query.pages[id].title] : response.query.pages[id].title;
        RedLinks.upgradeLinks(langLinks[title], response.query.pages[id].pageprops.wikibase_item);
    }
};

RedLinks.prototype.newArticle = function(url, callback) {
    var qid = url.match(/from=(Q\d+)/);
    var util = this.mw.util;
    if (qid && qid[1]) {
        util.addPortletLink(
            'p-tb', 'https://www.wikidata.org/wiki/' + qid[1],
            'Элемент Викиданных', 't-wikibase',
            'Ссылка на связанный элемент репозитория данных [g]', 'g'
        );
        this.links = { 'www.wikidata.org': {}};
        this.links['www.wikidata.org'][qid[1]] = '';
        this.callApiMethod({
        	ids: 0,
        	action: 'wbgetentities',
        	languages: 'ru', 
            props: 'claims|descriptions|sitelinks/urls'
        }, function(response) {
            callback(response.entities[qid[1]]);
        });
    }
};

RedLinks.prototype.processSourcePage = function(doc) {
    this.parseRedLinks(doc);
    for (var qid in this.links['']) {
        if (this.links[''].hasOwnProperty(qid)) {
            RedLinks.upgradeLinks(this.links[''][qid], qid);
        }
    }        
    this.callApiMethod({ titles: 0, action: 'query', prop: 'pageprops', ppprop: 'wikibase_item', 
        redirects: 1, meta: 'siteinfo'}, this.processQueryResponse.bind(this));
};
