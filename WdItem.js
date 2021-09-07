function WdItem (element) {
    this.element = element;
}
    
WdItem.prepareTitle = function (url, isPerson) {
    var title = decodeURI(url)
    	.match(/title=([^&]+)(?=&|$)/)[1]
    	.replaceAll('_', ' ').split('(')[0].trim();
    if (isPerson && title.indexOf(',') > 0) {
        return title.split(',')[1].trim() + ' ' + title.split(',')[0];
    }
    return title;
};

WdItem.forEachNonDeprecated = function (claims, property, callback, defaultValue) {
    var value = defaultValue;
    for (var i = 0; i < ((claims||[])[property]||[]).length; i++) {
        if (claims[property][i].rank !== 'deprecated') {
            var result = callback(claims[property][i]);
            if (result !== undefined && (defaultValue === undefined || value[0] === defaultValue[0])) {
                value = result;
            }
        }
    }
    return value;
};

WdItem.matchGender = function (adjective, noun) {
    if (noun && noun.endsWith('а')) {
        return adjective.replace ( /ый$/, 'ая' );
    } else {
        return adjective;
    }
};

WdItem.prototype.getValueByQualifier = function (property, qualifier, value) {
    return WdItem.forEachNonDeprecated(this.element.claims, property, function(statement) {
        if (
        	WdItem.forEachNonDeprecated(statement.qualifiers, qualifier, function(qual) {
	            if (qual.datavalue.value.id === value) return true;
	        })
        ) {
        	return statement.mainsnak.datavalue.value;
        }
    });
};

WdItem.prototype.getStarAliases = function (title) {
    var aliases = [];
    aliases.push(this.getValueByQualifier('P528', 'P972', 'Q105616')); // Bayer
    aliases.push(this.getValueByQualifier('P528', 'P972', 'Q111116')); // Flamsteed
    aliases.push(this.getValueByQualifier('P528', 'P972', 'Q111130')); // HD
    aliases = aliases.filter(function(id) { return id && id !== title; } );
    if (aliases.length > 0) {
        return ' (\'\'' + aliases.join(', ') + '\'\')';
    } else {
        return '';
    }
};

WdItem.prototype.getStarStub = function (title, type) {
    var constellation = {Q10580:['Весы (созвездие)','Весов'], Q10452:['Гончие Псы','Гончих Псов'], 
                         Q8865:['Скорпион (созвездие)','Скорпиона'], Q10586:['Орёл (созвездие)','Орла'], 
                         Q10498:['Сетка (созвездие)','Сетки'], Q9253:['Жертвенник (созвездие)','Жертвенника'], 
                         Q8667:['Волопас','Волопаса'], Q10506:['Райская Птица (созвездие)','Райской Птицы'],
                         Q8853:['Лев (созвездие)','Льва'], Q10437:['Летучая Рыба (созвездие)','Летучей Рыбы'], 
                         Q8906:['Змееносец','Змееносца'], Q10565:['Треугольник (созвездие)','Треугольника'],
                         Q9289:['Столовая Гора','Столовой Горы'], Q10538:['Большой Пёс','Большого Пса'], 
                         Q10492:['Микроскоп (созвездие)','Микроскопа'], Q8860:['Орион (созвездие)','Ориона'], 
                         Q10582:['Наугольник','Наугольника'], Q10428:['Единорог (созвездие)','Единорога'], 
                         Q10584:['Овен (созвездие)','Овна'], Q9256:['Андромеда (созвездие)','Андромеды'], 
                         Q10513:['Стрела (созвездие)','Стрелы'], Q8921:['Лебедь (созвездие)','Лебедя'], 
                         Q8844:['Центавр (созвездие)','Центавра'], Q10484:['Лира (созвездие)','Лиры'], 
                         Q10464:['Кассиопея (созвездие)','Кассиопеи'], Q9305:['Малый Пёс','Малого Пса'], 
                         Q10433:['Эридан (созвездие)','Эридана'], Q10574:['Часы (созвездие)','Часов'], 
                         Q8837:['Золотая Рыба','Золотой Рыбы'], Q9285:['Волосы Вероники','Волос Вероники'], 
                         Q8866:['Стрелец (созвездие)','Стрельца'], Q10576:['Водолей (созвездие)','Водолея'], 
                         Q8679:['Рыбы (созвездие)','Рыб'], Q10563:['Журавль (созвездие)','Журавля'],
                         Q10570:['Телец (созвездие)','Тельца'], Q10468:['Цефей (созвездие)','Цефея'],
                         Q10413:['Южная Корона','Южной Короны'], Q10511:['Персей (созвездие)','Персея'], 
                         Q8842:['Дева (созвездие)','Девы'], Q10457:['Хамелеон (созвездие)','Хамелеона'], 
                         Q10529:['Щит (созвездие)','Щита'], Q10525:['Секстант (созвездие)','Секстанта'], 
                         Q10488:['Резец (созвездие)','Резца'], Q10406:['Северная Корона','Северной Короны'], 
                         Q10450:['Индеец (созвездие)','Индейца'], Q10448:['Геркулес (созвездие)','Геркулеса'], 
                         Q10578:['Гидра (созвездие)','Гидры'], Q9302:['Дельфин (созвездие)','Дельфина'],
                         Q8913:['Печь (созвездие)','Печи'], Q10508:['Циркуль (созвездие)','Циркуля'], 
                         Q10416:['Южная Гидра','Южной Гидры'], Q10438:['Малый Конь','Малого Коня'], 
                         Q8923:['Близнецы (созвездие)','Близнецов'], Q9282:['Чаша (созвездие)','Чаши'], 
                         Q10441:['Феникс (созвездие)','Феникса'], Q10542:['Южный Крест','Южного Креста'], 
                         Q10517:['Ворон (созвездие)','Ворона'], Q10425:['Голубь (созвездие)','Голубя'], 
                         Q8910:['Змея (созвездие)','Змеи'], Q8832:['Жираф (созвездие)','Жирафа'],
                         Q8864:['Пегас (созвездие)','Пегаса'], Q10546:['Телескоп (созвездие)','Телескопа'],
                         Q10446:['Заяц (созвездие)','Зайца'], Q10519:['Лисичка (созвездие)','Лисички'], 
                         Q10478:['Малая Медведица','Малой Медведицы'], Q10571:['Волк (созвездие)','Волка'], 
                         Q10403:['Малый Лев','Малого Льва'], Q10515:['Павлин (созвездие)','Павлина'],
                         Q10521:['Паруса (созвездие)','Парусов'], Q10567:['Тукан (созвездие)','Тукана'], 
                         Q10409:['Южная Рыба','Южной Рыбы'], Q10481:['Насос (созвездие)','Насоса'], 
                         Q9251:['Корма (созвездие)','Кормы'], Q10503:['Октант (созвездие)','Октанта'], 
                         Q10430:['Ящерица (созвездие)','Ящерицы'], Q10476:['Возничий','Возничего'],
                         Q10435:['Муха (созвездие)','Мухи'], Q10535:['Козерог (созвездие)','Козерога'], 
                         Q10473:['Компас (созвездие)','Компаса'], Q10443:['Рысь (созвездие)','Рыси'], 
                         Q10486:['Живописец (созвездие)','Живописца'], Q10470:['Киль (созвездие)','Киля'], 
                         Q8675:['Дракон (созвездие)','Дракона'], Q9286:['Скульптор (созвездие)','Скульптора'], 
                         Q8849:['Рак (созвездие)','Рака'], Q10422:['Южный Треугольник','Южного Треугольника'],                          Q8839:['Кит (созвездие)','Кита'], Q8918:['Большая Медведица','Большой Медведицы']}
    [WdItem.forEachNonDeprecated(this.element.claims, 'P59', function(statement) { 
        return statement.mainsnak.datavalue.value.id; 
    })];
    var article = '{{' + 'Звезда|from=' + this.element.id + '}}\n\'\'\'' + title + '\'\'\'';

    if (type.length<2 || type[1].startsWith('Q')) {
        type[1] = 'звезда';
    }
    article += this.getStarAliases(title) + ' — ' + type[1];
    if (constellation) {
        article += ' в созвездии [[' + 
            constellation[0] + '|' + constellation[1] + ']]';
    }
    WdItem.forEachNonDeprecated(this.element.claims, 'P2583', function(distance) {
        var amount = parseInt(distance.mainsnak.datavalue.value.amount)*3.26156;
        var upper = parseInt(distance.mainsnak.datavalue.value.upperBound)*3.26156;
        var error = upper>amount ? Math.pow(10, Math.round(Math.log(upper-amount)/Math.log(10))) : 1;
        article += ', ' + WdItem.matchGender('удалённый', type[1]) + ' от Солнца на расстояние около '+
            Math.round(amount/error)*error + ' световых лет';
    });
    article += '\n\n== Примечания ==\n{{примечания}}';
    article += '\n{{star-stub}}';
    if (constellation) {
        article += '\n{{Звёзды созвездия ' + constellation[1] + '}}';
    }
    return article;
};

WdItem.prototype.getBoilerplate = function (url, dictionary) {
    var article = '';
    var isPerson = false;
    var item = this.element;
    var occupation = [];
    var type = WdItem.forEachNonDeprecated(this.element.claims, 'P31', function(statement) {
        if (statement.mainsnak.datavalue.value.id === 'Q5') {
            isPerson = true;
            return WdItem.forEachNonDeprecated(item.claims, 'P106', function(statement) {
                var value = dictionary[statement.mainsnak.datavalue.value.id];
                if (value) occupation.push(value[1]);
                return value;
            }, ['Персона']);
        }
        return dictionary[statement.mainsnak.datavalue.value.id];
    }, ['Универсальная карточка']);
    if (type) {
        if (type[0] === 'Звезда') return this.getStarStub(WdItem.prepareTitle(url), type);
        article += '{{' + type[0] + '|from=' + this.element.id + '}}\n';
    }
    article += '\'\'\'' + WdItem.prepareTitle(url, isPerson) + '\'\'\'';
    if (isPerson) {
        WdItem.forEachNonDeprecated(this.element.claims, 'P1559', function(statement) {
            article += ' ({{lang-' + statement.mainsnak.datavalue.value.language + '|' +
                statement.mainsnak.datavalue.value.text + '}})';
        });
    }
    article += ' — ';
    if ((this.element.descriptions||{}).ru)
        article += this.element.descriptions.ru.value;
    else
        article += occupation.join(', ');
    var externalLinks = '';
    ['P1343', 'P214', 'P244', 'P227', 'P7859', 'P1417'].forEach(function(p) {
        if (p in (this.element.claims||[]))
            externalLinks = '\n{{ВС|from=' + this.element.id + '}}';
    }.bind(this));
    article += '\n\n== Примечания ==\n{{примечания}}' + externalLinks;
    return article;
};

WdItem.prototype.addInterwiki = function (mw) {
    var projects = {aawiki: ['Qafár af', 'афарский'], abwiki: ['Аҧсшәа', 'абхазский'],
        acewiki: ['Acèh', 'ачехский'], adywiki: ['Адыгабзэ', 'адыгейский'],
        afwiki: ['Afrikaans', 'африкаанс'], akwiki: ['Akan', 'акан'],
        alswiki: ['Alemannisch', 'Alemannisch'], altwiki: ['Алтай тил', 'южноалтайский'],
        amwiki: ['አማርኛ', 'амхарский'], angwiki: ['Ænglisc', 'староанглийский'],
        anwiki: ['aragonés', 'арагонский'], arcwiki: ['ܐܪܡܝܐ', 'арамейский'],
        arwiki: ['العربية', 'арабский'], arywiki: ['الدارجة', 'Moroccan Arabic'],
        arzwiki: ['مصرى', 'Egyptian Arabic'], astwiki: ['asturianu', 'астурийский'],
        aswiki: ['অসমীয়া', 'ассамский'], atjwiki: ['Atikamekw', 'Atikamekw'],
        avkwiki: ['Kotava', 'Kotava'], avwiki: ['авар', 'аварский'], awawiki: ['अवधी', 'авадхи'], 
        aywiki: ['Aymar aru', 'аймара'], azbwiki: ['تۆرکجه', 'South Azerbaijani'], 
        azwiki: ['azərbaycanca', 'азербайджанский'], banwiki: ['Basa Bali', 'балийский'], 
        barwiki: ['Boarisch', 'Bavarian'], 'bat-smgwiki': ['žemaitėška', 'Samogitian'], 
        bawiki: ['башҡортса', 'башкирский'], bclwiki: ['Bikol Central', 'Central Bikol'],
        'be-x-oldwiki': ['беларуская (тарашкевіца)', 'Belarusian (Taraškievica orthography)'],
        bewiki: ['беларуская', 'белорусский'], bgwiki: ['български', 'болгарский'],
        bhwiki: ['भोजपुरी', 'Bhojpuri'], biwiki: ['Bislama', 'бислама'],
        bjnwiki: ['Banjar', 'Banjar'], bmwiki: ['bamanankan', 'бамбара'],
        bnwiki: ['বাংলা', 'бенгальский'], bowiki: ['བོད་ཡིག', 'тибетский'],
        bpywiki: ['বিষ্ণুপ্রিয়া মণিপুরী', 'Bishnupriya'], brwiki: ['brezhoneg', 'бретонский'],
        bswiki: ['bosanski', 'боснийский'], bugwiki: ['ᨅᨔ ᨕᨘᨁᨗ', 'бугийский'],
        bxrwiki: ['буряад', 'Russia Buriat'], cawiki: ['català', 'каталанский'],
        'cbk-zamwiki': ['Chavacano de Zamboanga', 'Chavacano'],
        cdowiki: ['Mìng-dĕ̤ng-ngṳ̄', 'Min Dong Chinese'], cebwiki: ['Cebuano', 'себуано'],
        cewiki: ['нохчийн', 'чеченский'], chowiki: ['Choctaw', 'чоктавский'],
        chrwiki: ['ᏣᎳᎩ', 'чероки'], chwiki: ['Chamoru', 'чаморро'],
        chywiki: ['Tsetsêhestâhese', 'шайенский'], ckbwiki: ['کوردی', 'сорани'],
        cowiki: ['corsu', 'корсиканский'], crhwiki: ['qırımtatarca', 'крымско-татарский'],
        crwiki: ['Nēhiyawēwin / ᓀᐦᐃᔭᐍᐏᐣ', 'кри'], csbwiki: ['kaszëbsczi', 'кашубский'],
        cswiki: ['čeština', 'чешский'], cuwiki: ['словѣньскъ / ⰔⰎⰑⰂⰡⰐⰠⰔⰍⰟ', 'церковнославянский'],
        cvwiki: ['Чӑвашла', 'чувашский'], cywiki: ['Cymraeg', 'валлийский'],
        dawiki: ['Dansk', 'датский'], dewiki: ['Deutsch', 'немецкий'],
        dinwiki: ['Thuɔŋjäŋ', 'динка'], diqwiki: ['Zazaki', 'Zazaki'],
        dsbwiki: ['dolnoserbski', 'нижнелужицкий'], dtywiki: ['डोटेली', 'Doteli'],
        dvwiki: ['ދިވެހިބަސް', 'мальдивский'], dzwiki: ['ཇོང་ཁ', 'дзонг-кэ'],
        eewiki: ['eʋegbe', 'эве'], elwiki: ['Ελληνικά', 'греческий'],
        emlwiki: ['emiliàn e rumagnòl', 'Emiliano-Romagnolo'], enwiki: ['English', 'английский'],
        eowiki: ['Esperanto', 'эсперанто'], eswiki: ['español', 'испанский'],
        etwiki: ['Eesti', 'эстонский'], euwiki: ['euskara', 'баскский'],
        extwiki: ['Estremeñu', 'Extremaduran'], fawiki: ['فارسی', 'персидский'],
        ffwiki: ['Fulfulde', 'фулах'], 'fiu-vrowiki': ['võro', 'võro'],
        fiwiki: ['Suomi', 'финский'], fjwiki: ['Na Vosa Vakaviti', 'фиджи'],
        fowiki: ['føroyskt', 'фарерский'], frpwiki: ['arpetan', 'Arpitan'],
        frrwiki: ['Nordfriisk', 'северный фризский'], frwiki: ['français', 'французский'],
        furwiki: ['furlan', 'фриульский'], fywiki: ['Frysk', 'западнофризский'],
        gagwiki: ['Gagauz', 'гагаузский'], ganwiki: ['贛語', 'гань'],
        gawiki: ['Gaeilge', 'ирландский'], gcrwiki: ['kriyòl gwiyannen', 'Guianan Creole'],
        gdwiki: ['Gàidhlig', 'гэльский'], glkwiki: ['گیلکی', 'Gilaki'],
        glwiki: ['galego', 'галисийский'], gnwiki: ["Avañe'ẽ", 'гуарани'],
        gomwiki: ['गोंयची कोंकणी / Gõychi Konknni', 'Goan Konkani'], gorwiki: ['Bahasa Hulontalo', 'горонтало'],
        gotwiki: ['𐌲𐌿𐍄𐌹𐍃𐌺', 'готский'], guwiki: ['ગુજરાતી', 'гуджарати'],
        gvwiki: ['Gaelg', 'мэнский'], hakwiki: ['客家語/Hak-kâ-ngî', 'хакка'],
        hawiki: ['Hausa', 'хауса'], hawwiki: ['Hawaiʻi', 'гавайский'],
        hewiki: ['עברית', 'иврит'], hifwiki: ['Fiji Hindi', 'Fiji Hindi'],
        hiwiki: ['हिन्दी', 'хинди'], howiki: ['Hiri Motu', 'хиримоту'],
        hrwiki: ['hrvatski', 'хорватский'], hsbwiki: ['hornjoserbsce', 'верхнелужицкий'],
        htwiki: ['Kreyòl ayisyen', 'гаитянский'], huwiki: ['magyar', 'венгерский'],
        hywiki: ['հայերեն', 'армянский'], hywwiki: ['Արեւմտահայերէն', 'Western Armenian'],
        hzwiki: ['Otsiherero', 'гереро'], iawiki: ['interlingua', 'интерлингва'],
        idwiki: ['Bahasa Indonesia', 'индонезийский'], iewiki: ['Interlingue', 'интерлингве'],
        igwiki: ['Igbo', 'игбо'], ikwiki: ['Iñupiak', 'инупиак'],
        ilowiki: ['Ilokano', 'илоко'], inhwiki: ['ГӀалгӀай', 'ингушский'],
        iowiki: ['Ido', 'идо'], iswiki: ['íslenska', 'исландский'],
        itwiki: ['Italiano', 'итальянский'], iuwiki: ['ᐃᓄᒃᑎᑐᑦ/inuktitut', 'инуктитут'],
        jamwiki: ['Patois', 'Jamaican Creole English'], jawiki: ['日本語', 'японский'],
        jbowiki: ['la .lojban.', 'ложбан'], jvwiki: ['Jawa', 'яванский'],
        kaawiki: ['Qaraqalpaqsha', 'каракалпакский'], kabwiki: ['Taqbaylit', 'кабильский'],
        kawiki: ['ქართული', 'грузинский'], kbdwiki: ['Адыгэбзэ', 'кабардинский'],
        kbpwiki: ['Kabɩyɛ', 'Kabiye'], kgwiki: ['Kongo', 'конго'],
        kiwiki: ['Gĩkũyũ', 'кикуйю'], kjwiki: ['Kwanyama', 'кунама'],
        kkwiki: ['қазақша', 'казахский'], klwiki: ['kalaallisut', 'гренландский'],
        kmwiki: ['ភាសាខ្មែរ', 'кхмерский'], knwiki: ['ಕನ್ನಡ', 'каннада'],
        koiwiki: ['перем коми', 'коми-пермяцкий'], kowiki: ['한국어', 'корейский'],
        krcwiki: ['къарачай-малкъар', 'карачаево-балкарский'], krwiki: ['Kanuri', 'канури'],
        kshwiki: ['Ripoarisch', 'кёльнский'], kswiki: ['कॉशुर / کٲشُر', 'кашмири'],
        kuwiki: ['kurdî', 'курдский'], kvwiki: ['коми', 'коми'],
        kwwiki: ['kernowek', 'корнский'], kywiki: ['Кыргызча', 'киргизский'],
        ladwiki: ['Ladino', 'ладино'], lawiki: ['Latina', 'латинский'],
        lbewiki: ['лакку', 'Lak'], lbwiki: ['Lëtzebuergesch', 'люксембургский'],
        lezwiki: ['лезги', 'лезгинский'], lfnwiki: ['Lingua Franca Nova', 'Lingua Franca Nova'],
        lgwiki: ['Luganda', 'ганда'], lijwiki: ['Ligure', 'Ligurian'],
        liwiki: ['Limburgs', 'лимбургский'], lldwiki: ['Ladin', 'Ladin'],
        lmowiki: ['lumbaart', 'Lombard'], lnwiki: ['lingála', 'лингала'],
        lowiki: ['ລາວ', 'лаосский'], lrcwiki: ['لۊری شومالی', 'севернолурский'],
        ltgwiki: ['latgaļu', 'Latgalian'], ltwiki: ['lietuvių', 'литовский'],
        lvwiki: ['latviešu', 'латышский'], madwiki: ['Madhurâ', 'мадурский'],
        maiwiki: ['मैथिली', 'майтхили'], 'map-bmswiki': ['Basa Banyumasan', 'Basa Banyumasan'],
        mdfwiki: ['мокшень', 'мокшанский'], mgwiki: ['Malagasy', 'малагасийский'],
        mhrwiki: ['олык марий', 'Eastern Mari'], minwiki: ['Minangkabau', 'минангкабау'],
        miwiki: ['Māori', 'маори'], mkwiki: ['македонски', 'македонский'],
        mlwiki: ['മലയാളം', 'малаялам'], mniwiki: ['ꯃꯤꯇꯩ ꯂꯣꯟ', 'манипурский'],
        mnwiki: ['монгол', 'монгольский'], mnwwiki: ['ဘာသာ မန်', 'Mon'],
        mrjwiki: ['кырык мары', 'Western Mari'], mrwiki: ['मराठी', 'маратхи'],
        mswiki: ['Bahasa Melayu', 'малайский'], mtwiki: ['Malti', 'мальтийский'],
        muswiki: ['Mvskoke', 'крик'], mwlwiki: ['Mirandés', 'мирандский'],
        myvwiki: ['эрзянь', 'эрзянский'], mywiki: ['မြန်မာဘာသာ', 'бирманский'],
        mznwiki: ['مازِرونی', 'мазандеранский'], nahwiki: ['Nāhuatl', 'Nāhuatl'],
        napwiki: ['Napulitano', 'неаполитанский'], nawiki: ['Dorerin Naoero', 'науру'],
        'nds-nlwiki': ['Nedersaksies', 'нижнесаксонский'], ndswiki: ['Plattdüütsch', 'нижненемецкий'],
        newiki: ['नेपाली', 'непальский'], newwiki: ['नेपाल भाषा', 'неварский'],
        ngwiki: ['Oshiwambo', 'ндонга'], niawiki: ['Li Niha', 'ниас'],
        nlwiki: ['Nederlands', 'нидерландский'], nnwiki: ['norsk nynorsk', 'нюнорск'],
        novwiki: ['Novial', 'Novial'], nowiki: ['norsk', 'норвежский'],
        nqowiki: ['ߒߞߏ', 'нко'], nrmwiki: ['Nouormand', 'Norman'],
        nsowiki: ['Sesotho sa Leboa', 'северный сото'], nvwiki: ['Diné bizaad', 'навахо'],
        nywiki: ['Chi-Chewa', 'ньянджа'], ocwiki: ['occitan', 'окситанский'],
        olowiki: ['livvinkarjala', 'Livvi-Karelian'], omwiki: ['Oromoo', 'оромо'],
        orwiki: ['ଓଡ଼ିଆ', 'ория'], oswiki: ['Ирон', 'осетинский'],
        pagwiki: ['Pangasinan', 'пангасинан'], pamwiki: ['Kapampangan', 'пампанга'],
        papwiki: ['Papiamentu', 'папьяменто'], pawiki: ['ਪੰਜਾਬੀ', 'панджаби'],
        pcdwiki: ['Picard', 'Picard'], pdcwiki: ['Deitsch', 'Pennsylvania German'],
        pflwiki: ['Pälzisch', 'Palatine German'], pihwiki: ['Norfuk / Pitkern', 'Norfuk / Pitkern'],
        piwiki: ['पालि', 'пали'], plwiki: ['polski', 'польский'],
        pmswiki: ['Piemontèis', 'Piedmontese'], pnbwiki: ['پنجابی', 'Western Punjabi'],
        pntwiki: ['Ποντιακά', 'Pontic'], pswiki: ['پښتو', 'пушту'],
        ptwiki: ['português', 'португальский'], quwiki: ['Runa Simi', 'кечуа'],
        rmwiki: ['rumantsch', 'романшский'], rmywiki: ['romani čhib', 'Vlax Romani'],
        rnwiki: ['Kirundi', 'рунди'], 'roa-rupwiki': ['armãneashti', 'Aromanian'],
        'roa-tarawiki': ['tarandíne', 'Tarantino'], rowiki: ['română', 'румынский'],
        ruewiki: ['русиньскый', 'Rusyn'], rwwiki: ['Kinyarwanda', 'киньяруанда'],
        sahwiki: ['саха тыла', 'саха'], satwiki: ['ᱥᱟᱱᱛᱟᱲᱤ', 'сантали'],
        sawiki: ['संस्कृतम्', 'санскрит'], scnwiki: ['sicilianu', 'сицилийский'],
        scowiki: ['Scots', 'шотландский'], scwiki: ['sardu', 'сардинский'],
        sdwiki: ['سنڌي', 'синдхи'], sewiki: ['davvisámegiella', 'северносаамский'],
        sgwiki: ['Sängö', 'санго'], shnwiki: ['ၽႃႇသႃႇတႆး', 'шанский'],
        shwiki: ['srpskohrvatski / српскохрватски', 'сербскохорватский'],
        simplewiki: ['Simple English', 'Simple English'], siwiki: ['සිංහල', 'сингальский'],
        skrwiki: ['سرائیکی', 'Saraiki'], skwiki: ['slovenčina', 'словацкий'],
        slwiki: ['slovenščina', 'словенский'], smnwiki: ['anarâškielâ', 'инари-саамский'],
        smwiki: ['Gagana Samoa', 'самоанский'], snwiki: ['chiShona', 'шона'],
        sowiki: ['Soomaaliga', 'сомали'], sqwiki: ['shqip', 'албанский'],
        srnwiki: ['Sranantongo', 'сранан-тонго'], srwiki: ['српски / srpski', 'сербский'],
        sswiki: ['SiSwati', 'свази'], stqwiki: ['Seeltersk', 'Saterland Frisian'],
        stwiki: ['Sesotho', 'южный сото'], suwiki: ['Sunda', 'сунданский'],
        svwiki: ['svenska', 'шведский'], swwiki: ['Kiswahili', 'суахили'],
        szlwiki: ['ślůnski', 'Silesian'], szywiki: ['Sakizaya', 'Sakizaya'],
        tawiki: ['தமிழ்', 'тамильский'], taywiki: ['Tayal', 'Tayal'],
        tcywiki: ['ತುಳು', 'Tulu'], tetwiki: ['tetun', 'тетум'],
        tewiki: ['తెలుగు', 'телугу'], tgwiki: ['тоҷикӣ', 'таджикский'],
        thwiki: ['ไทย', 'тайский'], tiwiki: ['ትግርኛ', 'тигринья'],
        tkwiki: ['Türkmençe', 'туркменский'], tlwiki: ['Tagalog', 'тагалог'],
        tnwiki: ['Setswana', 'тсвана'], towiki: ['lea faka-Tonga', 'тонганский'],
        tpiwiki: ['Tok Pisin', 'ток-писин'], trvwiki: ['Seediq', 'седекский'],
        trwiki: ['Türkçe', 'турецкий'], tswiki: ['Xitsonga', 'тсонга'],
        ttwiki: ['татарча/tatarça', 'татарский'], tumwiki: ['chiTumbuka', 'тумбука'],
        twwiki: ['Twi', 'тви'], tyvwiki: ['тыва дыл', 'тувинский'],
        tywiki: ['reo tahiti', 'таитянский'], udmwiki: ['удмурт', 'удмуртский'],
        ugwiki: ['ئۇيغۇرچە / Uyghurche', 'уйгурский'], ukwiki: ['українська', 'украинский'],
        urwiki: ['اردو', 'урду'], uzwiki: ['oʻzbekcha/ўзбекча', 'узбекский'],
        vecwiki: ['vèneto', 'Venetian'], vepwiki: ['vepsän kel’', 'Veps'],
        vewiki: ['Tshivenda', 'венда'], viwiki: ['Tiếng Việt', 'вьетнамский'],
        vlswiki: ['West-Vlams', 'West Flemish'], vowiki: ['Volapük', 'волапюк'],
        warwiki: ['Winaray', 'варай'], wawiki: ['walon', 'валлонский'],
        wowiki: ['Wolof', 'волоф'], wuuwiki: ['吴语', 'ву'],
        xalwiki: ['хальмг', 'калмыцкий'], xhwiki: ['isiXhosa', 'коса'],
        xmfwiki: ['მარგალური', 'Mingrelian'], yiwiki: ['ייִדיש', 'идиш'],
        yowiki: ['Yorùbá', 'йоруба'], zawiki: ['Vahcuengh', 'чжуань'],
        zeawiki: ['Zeêuws', 'Zeelandic'], 'zh-classicalwiki': ['文言', 'Classical Chinese'],
        'zh-min-nanwiki': ['Bân-lâm-gú', 'Chinese (Min Nan)'],
        'zh-yuewiki': ['粵語', 'Cantonese'], zhwiki: ['中文', 'китайский'], zuwiki: ['isiZulu', 'зулу']
    };
    for (var id in this.element.sitelinks) {
        if (projects[id])
            mw.util.addPortletLink('p-lang', this.element.sitelinks[id].url, 
                projects[id][0], null, this.element.sitelinks[id].title + ' — ' + projects[id][1]);
    }
};
