/**
 * URL de base de l'app (GitHub Pages : /nom-repo/client/) — sans balise <base>
 */
(function () {
    function appDirectory() {
        var path = window.location.pathname || '/';
        if (path.endsWith('/')) return path;
        var file = path.split('/').pop() || '';
        if (file.indexOf('.') !== -1) {
            return path.slice(0, path.lastIndexOf('/') + 1);
        }
        return path + '/';
    }
    window.getAzavisionAppUrl = function () {
        return window.location.origin + appDirectory();
    };
})();
