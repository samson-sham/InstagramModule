// NPM Dependencies
const Request = require('request'),
    Bluebird = require('bluebird'),
    requestPromise = Bluebird.promisify(Request),
    InstagramEncrypt = require('./InstagramEncrypt');

let HOST = 'https://www.instagram.com';

// This is to ensure a consistent UserAgent is used during the process,
// thus holds the integrity of GIS
function overrideUserAgent(options) {
    if (typeof options === 'string') {
        options = {
            'url': options
        };
    }
    options.headers = options.headers || {};
    options.headers['user-agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36';
    return options;
}
function ajax(options) {
    return requestPromise(overrideUserAgent(options)).then(response => {
        if (response.statusCode !== 200) {
            throw `NetworkError:${response.statusCode} ${response.body}`;
        }
        return response.body;
    }).catch(error => {
        console.log('[ajax] Error:', error);
        throw error;
    });
}
function flattenArray(array) {
    const flattenedArray = [].concat(...array);
    return flattenedArray.some(Array.isArray)
        ? flattenArray(flattenedArray)
        : flattenedArray;
}

class NoMoreEntries {}

class InstagramModule {
    constructor(stateProperties = {}) {
        Object.assign(this, stateProperties);
    }
    // stateless
    static fetchUserPage(user = 'anonymous') {
        console.log('[InstagramModule fetchUserPage]', user);
        return ajax(`${HOST}/${user}/`);
    }
    // stateful
    fetchUserPage(user = this.user || 'anonymous') {
        this.user = user;
        return this.constructor.fetchUserPage(user);
    }
    parsePage(page) {
        return this.constructor.findSharedData(page)
        .then(sharedData => {
            // userId
            this.userId = this.constructor.getUserId(sharedData);
            // RHX_GIS
            this.rhx_gis = sharedData.rhx_gis;
            // Next page indexes
            let { hasNextPage, nextCursor } = this.constructor.getNextPageStatus(sharedData);
            this.hasNextPage = hasNextPage;
            if (hasNextPage) {
                this.nextCursor = nextCursor;
                this.profileSrc = this.constructor.findProfilePageContainerScript(page);
            }
            return sharedData;
        });
    }
    static getUserId(sharedData = {}) {
        let profile = sharedData.entry_data && sharedData.entry_data.ProfilePage && sharedData.entry_data.ProfilePage.slice().shift(),
            user = profile && profile.graphql && profile.graphql.user || {};
        return user.id;
    }
    static getNextPageStatus(sharedData = {}) {
        let profile = sharedData.entry_data && sharedData.entry_data.ProfilePage && sharedData.entry_data.ProfilePage.slice().shift(),
            timeline = profile && profile.graphql && profile.graphql.user && profile.graphql.user.edge_owner_to_timeline_media;
        if (!profile) {
            timeline = sharedData.data && sharedData.data.user && sharedData.data.user.edge_owner_to_timeline_media;
        }
        let pageInfo = timeline && timeline.page_info || {},
            [hasNextPage, nextCursor] = [pageInfo.has_next_page, pageInfo.end_cursor];
        return {hasNextPage, nextCursor};
    }
    static findProfilePageContainerScript(body) {
        // fetch ConsumerCommons.js
        let profileRegex = /(?:"|')(\/.+\/ProfilePageContainer\.js\/\w+\.js)/i;
        let [selection, uri] = profileRegex.exec(body) || [];
        console.log('[InstagramModule findProfilePageContainerScript]', uri);
        return `${HOST}${uri}`;
    }
    static findQuerySignature(profilePageContainer) {
        let queryRegex = /(?:var \w+=")([a-f0-9]{32})",\s?\w+=Object\([\w.]+\)\(\{pageSize:[\w.]+,pagesToPreload:.+?queryId:"([a-f0-9]{32})/i;
        // [a-f0-9]{32}
        let [selection, queryHash, queryId] = queryRegex.exec(profilePageContainer);
        return {queryHash, queryId};
    }
    fetchQuerySignature() {
        if (!this.profileSrc) return Bluebird.reject(new Error('[instagramModule fetchQuerySignature] Required stateful variable not set', this.profileSrc));
        return ajax(this.profileSrc).then(this.constructor.findQuerySignature)
        .then(({ queryHash, queryId }) => Object.assign(this, { queryHash, queryId }));
    }
    /*
     * It is known that GIS being verified with the user agent
     */
    static fetchNextPage({
        id = "8003498180", 
        rhx_gis = "4ec99f1b7456a8e12345cbcb00e735ff",
        queryHash = "7c16654f22c819fb63d1183034a5162f",
        nextCursor = "AQBnaDY5ETNdGg0vj63RjvyLRVbjUa9VnRJAN1pCXfNuLre0io71Uj8TB4YBj4gmRNFw87S1MEvMCZF3mtBxZYWYO3E5g-XILNkyhRxdEG1jMw"
    } = {}) {
        let encryptionModule = new InstagramEncrypt({
            rhx_gis
        });
        let query = {
            id,
            'first': 12,
            'after': nextCursor
        };
        let qs = {
            "query_hash": queryHash,
            "variables": JSON.stringify(query)
        }, headers = {
            'x-instagram-gis': encryptionModule.obtainXHRSignature(query)
        };
        return ajax({
            'method': 'GET',
            'url': `${HOST}/graphql/query/`,
            headers,
            qs,
            'json': true
        });
    }
    // @Prerequisite: parsePage()
    fetchNextPage() {
        if (!this.nextCursor) return Bluebird.reject(new NoMoreEntries());
        if (!this.rhx_gis) return blueblird.reject(new Error('[instagramModule fetchNextPage] Required stateful variable not set', this.rhx_gis, this.profileSrc));
        let processPromise = Bluebird.resolve();
        if (!this.queryId || !this.queryHash) {
            processPromise = processPromise.then(this.fetchQuerySignature.bind(this));
        }
        processPromise = processPromise.then(() => {
            return this.constructor.fetchNextPage({
                'id': this.userId,
                'rhx_gis': this.rhx_gis,
                // Only the first fetch requires queryHash
                // subsequent requests uses queryId instead
                'queryHash': this.queryId,
                'nextCursor': this.nextCursor
            });
        });
        // simultaneously update state
        processPromise.then(nextData => {
            // Next page indexes
            let { hasNextPage, nextCursor } = this.constructor.getNextPageStatus(nextData);
            this.hasNextPage = hasNextPage;
            if (hasNextPage) {
                this.nextCursor = nextCursor;
            }
        });
        return processPromise;
    }
    static findSharedData(body) {
        console.log('[InstagramModule findSharedData]');
        return new Bluebird((resolve, reject) => {
            let scriptRegex = /<script type=\"text\/javascript\">window\._sharedData = (\{.+?);?<\/script>/im;
            let [scriptNode, sharedData] = scriptRegex.exec(body) || [];
            if (!sharedData) return reject(new Error('[InstagramModule findSharedData] SharedData not found'));
            try {
                return resolve(JSON.parse(sharedData));
            } catch(e) {
                return reject(e);
            }
        });
    }
    static findShortcode(url) {
        if (!url || !url.length) throw new Error('[InstagramModule findShortcode] Input error!', url);
        let entryRegex = /instagram\.com\/\w{1}\/([^/]+)/i;
        let [selection, shortcode] = entryRegex.exec(url) || [];
        return shortcode;
    }
    static listShortcodes(sharedData = {}) {
        let profile = sharedData.entry_data && sharedData.entry_data.ProfilePage && sharedData.entry_data.ProfilePage.slice().shift(),
            timeline = profile && profile.graphql && profile.graphql.user && profile.graphql.user.edge_owner_to_timeline_media;
        if (!profile) {
            timeline = sharedData.data && sharedData.data.user && sharedData.data.user.edge_owner_to_timeline_media;
        }
        let edges = timeline && timeline.edges || [];
        return edges.map(edge => edge.node && edge.node.shortcode).filter(x => x);
    }
    static fetchEntry(shortcodeId) {
        return ajax({
            'url': `${HOST}/p/${shortcodeId}/?__a=1`,
            'json': true
        });
    }
    // filterFn(commentText)
    static parseEntry(entry, filterFn) {
        if (!entry.graphql || !entry.graphql.shortcode_media) return [];
        return this._parseNodeToMedia(entry.graphql.shortcode_media, filterFn);
    }
    // filterFn(commentText)
    static _parseNodeToMedia(node, filterFn = (() => true)) {
        let commentNode = node.edge_media_to_caption && node.edge_media_to_caption.edges && node.edge_media_to_caption.edges.slice().shift();
        if (!filterFn(commentNode && commentNode.node.text)) return [];
        switch (node.__typename) {
            case "GraphImage":
                return [node.display_url];
            case "GraphVideo":
                return [node.video_url];
            case "GraphSidecar":
                let arr = node.edge_sidecar_to_children &&
                    node.edge_sidecar_to_children.edges &&
                    node.edge_sidecar_to_children.edges
                        .map(x => this._parseNodeToMedia(x.node)) || [];
                return flattenArray(arr);
            default:
                console.log('[InstagramModule parseNode] Unknown node type', node.__typename);
                return [];
        }
    }
    static deepSearch(url, delegatePromise) {
        // https://scontent.cdninstagram.com/t51.2885-15/sh0.08/e35/p750x750/16906858_276634752769663_25621279511937024_n.jpg
        // https://scontent.cdninstagram.com/t51.2885-15/s640x640/e15/16110150_1826558194259782_5002261818815545344_n.jpg
        // removing resolution part
        if (url.match(/\/\w\d+x\d+/)) {
            return deepSearch(url.replace(/\/\w\d+x\d+/, '')).catch(error => {
                return delegatePromise(url);
            });
        }
        // removing e35 or e15
        if (url.match(/\/\w\d{2,}\//)) {
            return deepSearch(url.replace(/\/\w\d{2,}\//, '/')).catch(error => {
                return delegatePromise(url);
            });
        }
        // removing sh0.08
        if (url.match(/\/\w{2}[.\d]+\//)) {
            return deepSearch(url.replace(/\/\w{2}[.\d]+\//, '/')).catch(error => {
                return delegatePromise(url);
            });
        }
        // remove anything between image & server
        if (url.match(/https?:\/\/scontent.cdninstagram.com\/.+?(\/.+?)\/\d+_\d+_\d+_\w\.\w+/)) {
            return deepSearch(url.replace(/(https?:\/\/scontent.cdninstagram.com\/.+?)\/.+?(\/\d+_\d+_\d+_\w\.\w+)/, '$1$2')).catch(error => {
                return delegatePromise(url);
            });
        }
        // switch from _n to _o
        if (url.match(/_n(\.\w+)$/)) {
            return deepSearch(url.replace(/_n(\.\w+)$/, '_o$1')).catch(error => {
                return delegatePromise(url);
            });
        }
        return delegatePromise(url);
    }
};

// Testing code, just ignore this
if (process.env.PROXY == '1') HOST = 'https://localhost:61440';
if (process.env.NODE_ENV == 'test') {
    let fs = require('fs-extra');
    InstagramModule.___fetchUserPage = (SOURCE = './test/test.html') => {
        console.log('[__fetchUserPage]', SOURCE);
        return fs.readFile(SOURCE);
    };
    InstagramModule.__fetchEntry = (SOURCE = './test/testNode.html') => {
        console.log('[__fetchEntry]', SOURCE);
        return fs.readJSON(SOURCE);
    };
    InstagramModule.__fetchVideoEntry = (SOURCE = './test/testVideoNode.html') => {
        console.log('[__fetchVideoEntry__fetchVideoEntry]', SOURCE);
        return fs.readJSON(SOURCE);
    };
    InstagramModule.__fetchSidecarEntry = (SOURCE = './test/testComposedNode.html') => {
        console.log('[__fetchSidecarEntry]', SOURCE);
        return fs.readJSON(SOURCE);
    };
    InstagramModule.__fetchNextPage = (SOURCE = './test/testNextCursor.json') => {
        console.log('[__fetchNextPage]', SOURCE);
        return fs.readJSON(SOURCE);
    };
    InstagramModule.__fetchProfilePageContainer = (SOURCE = './test/ProfilePageContainer.js.raw') => {
        console.log('[__fetchProfilePageContainer]', SOURCE);
        return fs.readFile(SOURCE, 'utf8');
    };
}
// Export module
module.exports = exports = InstagramModule;