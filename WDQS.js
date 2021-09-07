function WDQS (localStorage, fetch) {
    this.items = {};
    var stored = JSON.parse(localStorage.getItem('rl-dictionary'));
    if (stored && stored.timestamp && stored.version == 0) {
        this.items = stored;
        if ((new Date() - new Date(stored.timestamp)) < 1000*60*60*24*3) return;
    }
    
    var query = '\
        SELECT ?topic ?topicLabel ?template WITH {\
          SELECT DISTINCT * {\
            VALUES (?template ?rank) {("Шаблон:Карточка оружия"@ru 0) ("Шаблон:Ракетное оружие"@ru 1)\
                                      ("Шаблон:Этническая общность"@ru 0)}\
            ?template ^schema:name/schema:about/^wdt:P1424/^wdt:P279* ?topic\
            FILTER EXISTS { [] wdt:P31 ?topic }\
          }\
        } AS %B WITH {\
          SELECT DISTINCT * {\
            VALUES ?template { "Шаблон:Вооружённые силы"@ru "Шаблон:Галактика"@ru\
                               "Шаблон:Горнолыжный курорт"@ru "Шаблон:Звезда"@ru\
                               "Шаблон:Звёздное скопление"@ru "Шаблон:Музыкальный альбом"@ru\
                               "Шаблон:Народная песня"@ru "Шаблон:Сезон НБА"@ru\
                               "Шаблон:Спортивный сезон"@ru "Шаблон:Туманность"@ru "Шаблон:Финал НБА"@ru\
                               "Шаблон:Инстаблогер"@ru "Шаблон:Модельер"@ru "Шаблон:Самурай"@ru\
                               "Шаблон:Сумоист"@ru "Шаблон:Учёный"@ru "Шаблон:Фотомодель"@ru }\
            ?template ^schema:name/schema:about/^wdt:P1424/^wdt:P279* ?topic\
          }\
        } AS %G {\
          { INCLUDE %B } UNION { INCLUDE %G } UNION { VALUES (?template ?topic) { ("" wd:Q13406463) } }\
          SERVICE wikibase:label { bd:serviceParam wikibase:language "ru" }\
        } ORDER BY ?topic ?rank';

    fetch('https://query.wikidata.org/sparql?query=' + query.replace(/\s\s+/g, ' ')
        .replaceAll('%', '%25'), { headers: { 'Accept': 'application/json' }})
        .then(function(response) { return response.json(); } ).then(function(response) {
            this.items = {};
            for (var i = 0; i < (response.results.bindings||[]).length; i++) {
                var qid = response.results.bindings[i].topic.value.
                replace('http://www.wikidata.org/entity/','');
                this.items[qid] = [
                    response.results.bindings[i].template.value.replace('Шаблон:', ''),
                    response.results.bindings[i].topicLabel.value
                ];
            }
            this.items.timestamp = new Date().toISOString();
            this.items.version = 0;
            localStorage.setItem('rl-dictionary', JSON.stringify(this.items));
        }.bind(this));
}
