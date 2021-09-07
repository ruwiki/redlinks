describe('redLinks gadget', function(){
    context('parseRedLinks', function() {    
        it('should parse 1 red link', function() {
            var testPage = new RedLinks();
            var html = document.querySelector('div[id="test 1 нп5"]');
            testPage.parseRedLinks(html);
            var link = document.querySelector('a[id="link1"]');
            expect(testPage.links).to.eql({ 'en.wikipedia.org': { 'Saturn (Rubens)': [link] }});
        });

        it('should ignore plain red link', function() {
            var testPage = new RedLinks();
            var html = document.querySelector('div[id="test 1 plain link and 1 не переведено"]');
            testPage.parseRedLinks(html);
            var link2 = document.querySelector('a[id="link2"]');
            var link3 = document.querySelector('a[id="link3"]');
            expect(testPage.links).to.eql({
                'en.wikipedia.org': { 'RFA Stromness (A344)': [link2] },
                '': { 'Q12063857': [link3] }
            });
        });
    });

    context('callApiMethod', function() {
        it('should not throw exception when malformed input is provided', function() {
            var testPage = new RedLinks();
            testPage.callApiMethod();
            testPage.callApiMethod(1);
        });
        it('should pass concatenated Qxxx to API and call done', function(done) {
            var numberOfCalls = 0;
            var mw = {};
            mw.ForeignApi = function (wikidataApiUrl) {
                expect(wikidataApiUrl).to.be.oneOf(
                    ['//de.wikipedia.org/w/api.php', '//en.wikipedia.org/w/api.php']);
                return { get: function(params) {
                    expect(params).to.include({
                        action: 'api'
                    });
                    expect(params.ids).to.be.oneOf(['A|B', 'Ä']);
                    return { done: function(callback) {
                        callback({ query: { general: { servername: 'en.wikipedia.org' },
                             pages: { 1: { title: 'Foreign key', pageprops: { wikibase_item: 'Q1' }}}
                        }});
                        if (numberOfCalls++ > 0) done();
                    }};
                }};
            };
            var testPage = new RedLinks(mw, {
                'en.wikipedia.org': { A: 1, B: 2 },
                'de.wikipedia.org': { Ä: 3},
                '': { 'Q1': 4 }
            });
            testPage.callApiMethod({ ids: 0, action: 'api' }, testPage.processQueryResponse.bind(testPage));
        });
    });

    context('processQueryResponse', function() {
        it('should do nothing than there is noting to process', function() {
            var testPage = new RedLinks();
            testPage.processQueryResponse();
            expect(testPage.links).to.be.empty;
            
            testPage.processQueryResponse({
                query: { pages: { 1: { title: 'Foreign key', pageprops: { wikibase_item: 'Q1' }}}}
            });
            expect(testPage.links).to.be.empty;
        });
        it('should do nothing if there are no server name in API response', function() {
            var links = {'en.wikipedia.org': {'Foreign key': [22]}};
            var testPage = new RedLinks(null, links);
            testPage.processQueryResponse({general: {}, 
                query: { pages: { 1: { title: 'Foreign key', pageprops: { wikibase_item: 'Q1' }}}}
            });
            expect(testPage.links).to.eql(links);
        });
        it('should attach to url exactly one qid joined by title', function() {
            var link = { href: 'title=Внешний_ключ' };
            var testPage = new RedLinks(null, {'en.wikipedia.org': {'Foreign key': [link]}});
            testPage.processQueryResponse({
                query: { pages: { 1: { title: 'Foreign key', pageprops: { wikibase_item: 'Q1056760' }}},
                general: { servername: 'en.wikipedia.org' }}
            });
            expect(link.href)
                .to.include('editintro=T:Нет_статьи/editintro').and
                .to.include('from=Q1056760');
        });
        it('should follow redirects', function() {
            var link = { href: 'title=А' };
            var testPage = new RedLinks(null, {'ru.wikipedia.org': {'Щ': [link]}});
            testPage.processQueryResponse({query: { general: { servername: 'ru.wikipedia.org' },
                redirects: [{ from: 'Щ', to: 'A' }], 
                pages: { 1: { title: 'A', pageprops: { wikibase_item: 'Q28047' }}}
            }});
            expect(link.href).to.include('from=Q28047');
        });
        it('should process normalized titles', function() {
            var link = { href: 'title=1' };
            var testPage = new RedLinks(null, {'ru.wikipedia.org': {'sucker punch': [link]}});
            testPage.processQueryResponse({query: { general: { servername: 'ru.wikipedia.org' },
                normalized: [{ from: 'sucker punch', to: 'Sucker punch' }], 
                pages: { 1: { title: 'Sucker punch', pageprops: { wikibase_item: 'Q7633099' }}}
            }});
            expect(link.href).to.include('from=Q7633099');
        });
        it('should skip non-existing page', function() {
            var testPage = new RedLinks(null, {'en.wikipedia.org': {'|': { href: 'title=1' }}});
            testPage.processQueryResponse({query: { general: { servername: 'en.wikipedia.org' },
                pages: { '-1': { title: '|' }}
            }});
        });
    });

    context('newArticle', function() {
        it ('should place wikidata link to sidebar', function(done) {
            var testPage = new RedLinks({ util: { addPortletLink: function (section, url, text, id ,hint) {
                if (section === 'p-tb') {
                    expect(url).to.equal('https://www.wikidata.org/wiki/Q0');
                    expect(text).to.equal('Элемент Викиданных');
                    expect(hint).to.equal('Ссылка на связанный элемент репозитория данных [g]');
                    done()
                } 
            }}});
            testPage.callApiMethod = function() {}
            testPage.newArticle('from=Q0&title=test', function(){});
        });
    });
    
    context('processSourcePage', function() {
        it ('should place wikidata and enwiki links to sidebar', function(done) {
            var mockMediaWiki = { ForeignApi: function (wikidataApiUrl) {
                return { get: function(params) {
                    return { done: function(callback) {
                        callback({ query: { general:{ servername: 'en.wikipedia.org' }, pages: 
                            { 1: { title: 'Saturn (Rubens)', pageprops: { wikibase_item: 'Q6122115' }}}
                        }});
                        try {
                            var link1 = document.querySelector('a[id="link1"]');
                            expect(link1.href).to.include('from=Q6122115');
                            done(); // call done with no parameter to indicate that it() is done()
                        } catch( e ) {
                            done( e ); // call done with an error Object to indicate that it() failed
                        }   
                }};
            }}}};
            var testPage = new RedLinks(mockMediaWiki);
            var html = document.querySelector('div[id="test 1 нп5"]');
            testPage.processSourcePage(html);
        });
    });
});

describe('WdItem', function() {
    context('prepareTitle', function() {
        it('should replace underscore with spaces and leave comma', function(){
            expect(WdItem.prepareTitle(
                'https://ru.wikipedia.org/w/index.phptitle=10,000_Hours&action=edit&redlink=1'
                )).to.be.equal('10,000 Hours');
		});
        it('should normalize people name', function() {
            expect(WdItem.prepareTitle('title=Зайцев,_Иван_Андреевич', true
                )).to.be.equal('Иван Андреевич Зайцев');
        });
    });

    context('forEachNonDeprecated', function() {
        it('should return default value while getting malformed item', function() {
            expect(WdItem.forEachNonDeprecated()).to.be.undefined;
            expect(WdItem.forEachNonDeprecated({})).to.be.undefined;
            expect(WdItem.forEachNonDeprecated(1, 'P1')).to.be.undefined;
        });

        it('should ignore P31:Q5 with deprecated rank', function() {
            var claims = {P31:[{rank:'deprecated'}, {mainsnak:{datavalue:{value:{id:'Q5'}}}}]};
            var called = 0;
            expect(WdItem.forEachNonDeprecated(claims, 'P31', function() { called++; }, 'test')).
                to.be.equal('test');
            expect(called).to.be.equal(1);
        });
    });

    context('getStarAliases', function() {
        it('should not return aliases that are the same as article title', function() {
            var item = new WdItem({ id: 'Q73996824', 
                claims: { 'P528': [{ mainsnak: { datavalue: { value: 'HD 216536'}},
                    qualifiers: { 'P972': [{ datavalue: { value: { id: 'Q111130'}}}]}
            }]}});
            expect(item.getStarAliases('HD 216536')).to.be.empty;
        });
    });
    
    context('getStarStub', function() {
        it('should use default text when ru-label is not defined', function() {
            var item = new WdItem({id:'Q0',claims:{
                'P31':[{mainsnak:{datavalue:{value:{id:'Q911245'}}}}]
            }});
            expect(item.getStarStub('title', ['Звезда'])).
                to.include('звезда');
            expect(item.getStarStub('title', ['Звезда', 'Q911245'])).
                to.include('звезда').
                to.not.include('Q911245');
        });
        it('should calculate distance in light years', function() {
            var item = new WdItem({id:'Q0',claims:{
                'P31':[{mainsnak:{datavalue:{value:{id:'Q523'}}}}],
                'P2583':[{mainsnak:{datavalue:{value:{unit:'http://www.wikidata.org/entity/Q12129',
                    amount:'+500.851', upperBound: '+513.243', lowerBound: '+488.459'}}}}]
            }});
            expect(item.getStarStub('title', ['Звезда'])).to.include('на расстояние около 1600');
        });
    });
    
    context('getBoilerplate', function() {
        it('should return generic boilerplate for empty element', function() {
            var item = new WdItem({ id: 'Q0' });
            expect(item.getBoilerplate('title=test'))
                .to.include('|from=Q0')
                .to.include('== Примечания ==')
                .to.include('{{примечания}}');
        });
		it('should produce star stab for P31:Q863936 with specific preamble', function(){
            var item = new WdItem({id:'Q0',claims:{
                'P31':[{mainsnak:{datavalue:{value:{id:'Q863936'}}}}],
                'P59':[{mainsnak:{datavalue:{value:{id:'Q10571'}}}}],
                'P2583':[{mainsnak:{datavalue:{value:{unit:'http://www.wikidata.org/entity/Q12129',
                    amount:'10'}}}}]
            }});
            var dictionary = {'Q863936': ['Звезда', 'оранжевый карлик']};
            expect(item.getBoilerplate ('title=test', dictionary))
                .to.include('{{Звезда|from=Q0}}')
                .to.include('оранжевый карлик в созвездии [[Волк (созвездие)|Волка]]')
                .to.include('{{Звёзды созвездия Волка}}')
                .to.include('{{star-stub}}');
        });
		it('should format page title for P31:Q5', function(){
            var item = new WdItem(
                {id:'Q',claims:{'P31':[{rank:'normal',mainsnak:{datavalue:{value:{id:'Q5'}}}}]}});
            expect(item.getBoilerplate ('title=Surname,_Name', {})).to.include("'''Name Surname'''");
        });
        it('should use desctiption when available', function(){
            var item = new WdItem({id:'Q', descriptions: { ru: { value: 'some info' }}});
            expect(item.getBoilerplate ('title=1')).to.include('some info');
        });
        it('should include external links template when VIAF is specified', function(){
            var text = new WdItem({id:'Q0',claims:{'P214':0, 'P7859':0}}).getBoilerplate ('title=1');
            expect((text.match(/{{ВС\|from=Q0/g) || []).length).to.equal(1);
        });
        it('should return original name of the person if P1559 is specified', function(){
            var item = new WdItem({id:'Q31190679',claims:{
                'P31':[{mainsnak:{datavalue:{value:{id:'Q5'}}}}],
                'P1559':[{mainsnak:{datavalue:{value:{text:'Neva Çiftçioğlu', language: 'tr'}}}}]
            }});
            expect(item.getBoilerplate ('title=1')).to.include('{{lang-tr|Neva Çiftçioğlu}}');
        });
        it('should include non-default infobox and occupations', function(){
            var item = new WdItem({id:'Q0',claims:{
                'P21':[{mainsnak:{datavalue:{value:{id:'Q6581072'}}}}],
                'P31':[{mainsnak:{datavalue:{value:{id:'Q5'}}}}],
                'P106':[{mainsnak:{datavalue:{value:{id:'Q169470'}}}},
                    {mainsnak:{datavalue:{value:{id:'Q1930187'}}}},
                    {mainsnak:{datavalue:{value:{id:'Q937857'}}}}]
            }});
            expect(item.getBoilerplate ('title=1', {
                Q169470: ['Учёный','физик'],
                Q1930187: ['Персона','журналист'],
            })).to.include('физик, журналистка').to.include('{{Учёный');
        });
    });
    
    context('addInterwiki', function() {
        it('should place only wikipedia links', function(done){
            var item = new WdItem({sitelinks: {enwiki: { title: '1', url: 
            'https://en.wikipedia.org/wiki/1'
            }, dewikiquote: { url:
            'https://de.wikiquote.org/wiki/Eins'
            }}});
            item.addInterwiki({ util: { addPortletLink: function (section, url, text, id ,hint) {
                if (section === 'p-lang') {
                    expect(url).to.equal('https://en.wikipedia.org/wiki/1');
                    expect(text).to.equal('English');
                    expect(hint).to.equal('1 — английский');
                    done();
                }
            }}});
        });
    });
});

describe('WDQS', function() {
    it('should query WDQS when no localStorage copy exists', function(done){
        var wdqs = new WDQS(
            { getItem: function () { return '{}'; } }, 
            function() { done(); }
        );
    });
    it('should not query WDQS when localStorage with version==0 and timestamp in the future', function(){
        var wdqs = new WDQS(
            { getItem: function () { return '{"version": 0, "timestamp": "2999-01-01"}'; }}
        );
    });
    it('should query WDQS when localStorage copy is too old', function(done) {
        var d = new Date();
        d.setDate(d.getDate()-3);
        var wdqs = new WDQS(
            { getItem: function () { return '{"version": 0, "timestamp": "'+d.toJSON()+'"}'; }}, 
            function() { done(); }
        );
    });
    it('should use ignore first topic, if second exists in response', function(){
        var wdqs = new WDQS(
            { getItem: function () { return '{}'; }, setItem: function () {} }, 
            function() { return { then: function() { return {then: function(callback) {
                callback({results: { bindings: [{
                    topic: { value: 'http://www.wikidata.org/entity/Q1049158' },
                    topicLabel: { value: 'ракета «воздух-поверхность»' },
                    template: { value: 'Шаблон:Карточка оружия' }
                }, { 
                    topic: { value: 'http://www.wikidata.org/entity/Q1049158' },
                    topicLabel: { value: 'ракета «воздух-поверхность»' },
                    template: { value: 'Шаблон:Ракетное оружие' }
                }]}});
            }};}};}
        );
        expect(wdqs.items).to.deep.include(
            {'Q1049158': ['Ракетное оружие', 'ракета «воздух-поверхность»']}
        ).to.not.deep.include(
            {'Q1049158': ['Карточка оружия', 'ракета «воздух-поверхность»']}
        );
    });
});
