describe('LearnJS', function() {
    it('can show a problem view', function() {
        learnjs.showView('#problem-1');
        expect($('.view-container .problem-view').length).toEqual(1);
    });
    it('can show the default view, aka the landing page', function() {
        learnjs.showView('');
        expect($('.view-container .landing-view').length).toEqual(1);
    });
    it('passes the # view parameter to the view function by delimitating with a - ', function(){
        spyOn(learnjs, 'problemView');
        learnjs.showView('#problem-42');
        expect(learnjs.problemView).toHaveBeenCalledWith('42');
    });
    it('invokes the router when loaded', function(){
        console.log('here I am router invocation');
        spyOn(learnjs, 'showView');
        learnjs.appOnReady();
        expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
    });
    it('subscribes to the hash change event', function() {
        learnjs.appOnReady();
        spyOn(learnjs, 'showView');
        $(window).trigger('hashchange');
        expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
    });
    describe('problem view', function() {
        
        describe('answer section', function() {
            beforeEach(function() {
                view = learnjs.problemView('1');
            });
            it('can check a correct answer by hitting a button', function(){
                
                view.find('.answer').val('true');
                view.find('.check-btn').click();
                expect(view.find('.result').text().includes('Correct!'));
            });
            it('rejects an incorrect answer', function(){
                view.find('.answer').val('false');
                view.find('.check-btn').click();
                expect(view.find('.result').text()).toEqual('Incorrect!');
            });
        });
    });
});