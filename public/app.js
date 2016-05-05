'use strict';

function googleSignIn(googleUser) {
    var id_token = googleUser.getAuthResponse().id_token;
    console.log("id_token:  " + id_token);
    AWS.config.update({
        region: 'us-east-1',
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: learnjs.poolId,
            Logins: {
                'accounts.google.com': id_token
            }
        })
    })
    console.log(arguments);

    function refresh() {
        return gapi.auth2.getAuthInstance().signIn({
            prompt: 'login'
        }).then(function(userUpdate) {
            var creds = AWS.config.credentials;
            var newToken = userUpdate.getAuthResponse().id_token;
            console.log("newToken:  " + newToken);
            creds.params.Logins['accounts.google.com'] = newToken;
            return learnjs.awsRefresh();
        });
    }


    learnjs.awsRefresh().then(function(id) {
        console.log("id " + id);
        learnjs.identity.resolve({
            id: id,
            email: googleUser.getBasicProfile().getEmail(),
            refresh: refresh
        });
    });

}


var learnjs = {
    // learnjs2 poolId: 'us-east-1:4e420732-a731-453c-a2b5-be7dccabce27'
    poolId: 'us-east-1:79940213-7ace-4891-868d-3a3e57688562'
};

learnjs.identity = new $.Deferred();

learnjs.problems = [{
    description: "What is truth?",
    code: "function problem() { return __;}"
}, {
    description: "Simple Math",
    code: "function problem() { return 42 === 6 * __;}"
}, {
    description: "Hitchhiker's Guide to the Galaxy",
    code: "function problem() { return __ === 42;}"
}];

learnjs.addProfileLink = function(profile){
    var link = learnjs.template('profile-link');
    link.find('a').text(profile.email);
    $('.signin-bar').prepend(link);
}
learnjs.applyObject = function(obj, elem) {
    for (var key in obj) {
        elem.find('[data-name="' + key + '"]').text(obj[key]);
    }
}
learnjs.awsRefresh = function() {
    var deferred = new $.Deferred();
    
    console.log("google token: " + AWS.config.credentials.params.Logins["accounts.google.com"]);
    AWS.config.credentials.refresh(function(err) {
        console.log("refresh google token: " + AWS.config.credentials.params.Logins["accounts.google.com"]);
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(AWS.config.credentials.identityId);
        }
    });
    /*
    var id_token = AWS.config.credentials.params.Logins["accounts.google.com"];
    AWS.config.update({
        region: 'us-east-1',
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: learnjs.poolId,
            Logins: {
                'accounts.google.com': id_token
            }
        })
    });
    */
    return deferred.promise();
}
learnjs.buildCorrectFlash = function(problemNum) {
    var correctFlash = learnjs.template('correct-flash');
    var link = correctFlash.find('a');
    if (problemNum < learnjs.problems.length) {
        link.attr('href', '#problem-' + (problemNum + 1));
    } else {
        link.attr('href', '');
        link.text("You're Finished!");
    }
    return correctFlash;
};
learnjs.flashElement = function(elem, content) {
    elem.fadeOut('fast', function() {
        elem.html(content);
        elem.fadeIn();
    });
};
learnjs.landingView = function() {
    return learnjs.template('landing-view');
}
learnjs.problemView = function(data) {
    var problemNumber = parseInt(data, 10);
    var view = $('.templates .problem-view').clone();
    var problemData = learnjs.problems[problemNumber - 1];
    var resultFlash = view.find('.result');

    if (problemNumber < learnjs.problems.length) {
        var buttonItem = learnjs.template('skip-btn');
        buttonItem.find('a').attr('href', '#problem-' + (problemNumber + 1));
        $('.nav-list').append(buttonItem);
        view.bind('removingView', function() {
            buttonItem.remove();
        });
    }

    function checkAnswer() {
        var answer = view.find('.answer').val();
        var test = problemData.code.replace('__', answer) + '; problem();';
        return eval(test);
    }

    function checkAnswerClick() {
        if (checkAnswer()) {
            learnjs.buildCorrectFlash(problemNumber);
            learnjs.flashElement(resultFlash, learnjs.buildCorrectFlash(problemNumber));
        } else {
            learnjs.flashElement(resultFlash, 'Incorrect!');
        }
        return false;
    }

    view.find('.check-btn').click(checkAnswerClick);
    view.find('.title').text('Problem #' + problemNumber);
    learnjs.applyObject(learnjs.problems[problemNumber - 1], view);
    return view;
}

learnjs.profileView = function() {
    var view = learnjs.template('profile-view');
    learnjs.identity.done(function(identity) {
        view.find('.email').text(identity.email);
    });
    return view;
}
learnjs.showView = function(hash) {
    var routes = {
        '#problem': learnjs.problemView,
        '': learnjs.landingView,
        '#': learnjs.landingView,
        '#landing': learnjs.landingview,
        '#profile': learnjs.profileView
    };
    var hashParts = hash.split('-');
    var viewFn = routes[hashParts[0]];
    if (viewFn) {
        learnjs.triggerEvent('removingView', []);
        $('.view-container').empty().append(viewFn(hashParts[1]));
    }
}
learnjs.template = function(name) {
    return $('.templates .' + name).clone();
};
learnjs.triggerEvent = function(name, args) {
    $('.view-container>*').trigger(name, args);
}

learnjs.appOnReady = function() {
    console.log('here I am appOnReady');
    window.onhashchange = function() {
        learnjs.showView(window.location.hash);
    };
    learnjs.showView(window.location.hash);
    learnjs.identity.done(learnjs.addProfileLink);
}