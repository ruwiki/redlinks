(function(mw, $) {
    var wdqs = new WDQS(localStorage, fetch),
    	$textbox,
    	item;
    mw.loader.using(['mediawiki.util', 'mediawiki.ForeignApi']).done(function() {
        mw.hook('wikipage.content').add(function(content) {
            if (mw.config.get('wgAction') === 'view') {
                new RedLinks(mw).processSourcePage(content[0]);
            } else if (mw.config.get('wgEditMessage') == 'creating') {
                if (!item) {
                    new RedLinks(mw).newArticle(window.location.href, function(element) {
                        item = new WdItem(element);
                        $textbox = content.find('#wpTextbox1');
                        $textbox.val(item.getBoilerplate(window.location.href, wdqs.items));
                        item.addInterwiki(mw);
                    });
                } else {
                    item.addInterwiki(mw);
                }
            }
        });
    });
}(mediaWiki, jQuery));
