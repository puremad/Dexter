defectApp.controller('DefectCtrl', function ($scope, $http, $sce, $location, $anchorScroll, $routeParams, $log) {
    "use strict";

    var isSnapshotView = function () {
        if ($routeParams.snapshotId === undefined) {
            return false;
        }
        $scope.snapshotId = $routeParams.snapshotId;
        return true;
    };

    var init = function () {
        $scope.isSnapshotView = isSnapshotView();

        $scope.fileTreeId = {};
        $scope.isFileTreeHidden = true;
        $scope.isLoginBtnHidden = true;
        $scope.isDetailTabHidden = false;
        $scope.isButtonHidden = true;
        $scope.isAdminUser = false;
        $scope.isCurrentLoginId = false;

        $scope.isFileTreeBtnTitleHidden = 'Show File Tree';

        $('#animatiroonTab').css('display', 'none');
        $('#animationTab').css('left', document.body.clientWidth);

        $scope.search = {
            modulePath: '',
            fileName: '',
            statusCode: '',
            severityCode: '',
            categoryName: '',
            checkerCode: '',
            modifierNo: ''
        };

        $scope.treeItem = {
            'modulePath': '',
            'name': '',
            'label': '',
            'type': '',
            'defectCount': '',
            'newCount': '',
            'fixCount': '',
            'excCount': '',
            'children': []
        };

        $scope.didList = [];
        $scope.fileTree = [];
        $scope.defectSelections = [];
        $scope.defectList = [];
        $scope.selectedDidListInGrid = [];
        $scope.currentDefectList = [];
        $scope.currentFileList = [];

        $scope.csvContent = [];
        $scope.csvSnapshotContent = [];

        $scope.totalServerItems = 0;
        $scope.projectName = "";

        initLocalStorage();
        getProjectName();
        checkLogin();
    };

    var commentIndex1 = [];
    var commentIndex2 = [];

    init();

    var url = $location.absUrl().split('?');

    $scope.getCSVHeader = function () {
        if ($scope.isSnapshotView) {
            return ["Did", "Checker", "Count", "Line No", "Severity", "Category", "Snapshot Status", "Current Status",
                "Module", "File", "Class", "Method/Function", "Language", "Tool", "Author", "Date", "", "", "URL", url];
        } else {
            return ["Did", "Checker", "Count", "Line No", "Severity", "Category", "Status",
                "Module", "File", "Class", "Method/Function", "Language", "Tool", "Author", "Date", "", "", "URL", url];
        }
    };

    var SECURITY_CHECKER = 'SECURITY';

    function pushNoDefect() {
        $scope.csvContent.push({
            'Did': 0,
            'Checker': 'None',
            'Count': 0,
            'Line No': 0,
            'Severity': 0,
            'Category': 'None',
            'Status': 'None',
            'Module': 'None',
            'File': 'None',
            'Class': 'None',
            'Method/Function': 'None',
            'Language': 'None',
            'Tool': 'None',
            'Author': 'None',
            'Date': 'There is no defect in this project'
        });
    }

    function pushNoSnapshotDefect() {
        $scope.csvSnapshotContent.push({
            'Did': 'None',
            'Checker': 'None',
            'Count': 0,
            'Line No': 0,
            'Severity':  'None',
            'Category':  'None',
            'Snapshot Status':  'None',
            'Current Status':  'None',
            'Module':  'None',
            'File':  'None',
            'Class':  'None',
            'Method/Function':  'None',
            'Language':  'None',
            'Tool':  'None',
            'Author':  'None',
            'Date':  'None'
        });
    }

    function pushDefect(defect) {
        $scope.csvContent.push({
            'Did': defect.did,
            'Checker': defect.checkerCode,
            'Count': defect.occurenceCount,
            'Line No': defect.occurenceLine,
            'Severity': defect.severityCode,
            'Category': defect.categoryName,
            'Status': defect.statusCode,
            'Module': defect.modulePath,
            'File': defect.fileName,
            'Class': defect.className,
            'Method/Function': defect.methodName,
            'Language': defect.language,
            'Tool': defect.toolName,
            'Author': defect.creatorId,
            'Date': defect.modifiedDateTime
        });
    }

    function pushSnapshotDefect(snapshotDefect) {
        $scope.csvSnapshotContent.push({
            'Did': snapshotDefect.did,
            'Checker': snapshotDefect.checkerCode,
            'Count': snapshotDefect.occurenceCount,
            'Line No': snapshotDefect.occurenceLine,
            'Severity': snapshotDefect.severityCode,
            'Category': snapshotDefect.categoryName,
            'Snapshot Status': snapshotDefect.statusCode,
            'Current Status': snapshotDefect.currentStatusCode,
            'Module': snapshotDefect.modulePath,
            'File': snapshotDefect.fileName,
            'Class': snapshotDefect.className,
            'Method/Function': snapshotDefect.methodName,
            'Language': snapshotDefect.language,
            'Tool': snapshotDefect.toolName,
            'Author': snapshotDefect.creatorId,
            'Date': snapshotDefect.modifiedDateTime
        });
    }

    $scope.getCSVContent = function () {
        if($scope.isSnapshotView){
            return setSnapshotDefectCSVContent()
                .then(function(){
                    return $scope.csvSnapshotContent;
                })
        } else {
            return setDefectCSVContent()
                .then(function () {
                    return $scope.csvContent;
                });
        }
    };

    function setDefectCSVContent() {
        $scope.csvContent = [];
        var getDefectListURL = '/api/v2/defectAll';
        return $http.get(getDefectListURL, {
        }).then(function (results) {
            if (isHttpResultOK(results)) {
                var result = results.data.rows;
                if(result.length === 0){
                    pushNoDefect();
                    return ;
                }
                angular.forEach(result, function (defect) {
                    pushDefect(defect);
                });
                return ;
            }
        })
    }

    function setSnapshotDefectCSVContent(){
        $scope.csvSnapshotContent=[];
        var getSnapshotDefectListURL = '/api/v2/snapshotAll';
        return $http.get(getSnapshotDefectListURL,{
            params: {
                'snapshotId': $scope.snapshotId
            }
        }).then(function(results){
            if(isHttpResultOK(results)){
                var result = results.data.rows;
                if(result.length === 0){
                    pushNoSnapshotDefect();
                    return ;
                }
                angular.forEach(result, function(snapshotDefect){
                    pushSnapshotDefect(snapshotDefect);
                });
                return ;
            }
        })
    }

    $scope.getSecurityCSVContent = function(){
        if($scope.isSnapshotView){
            return setSecuritySnapshotCSVContent()
                .then(function(){
                    return $scope.csvSnapshotContent;
                })

        }else {
            return setSecurityCSVContent()
                .then(function () {
                    return $scope.csvContent;
                })
        }
    };

    function setSecurityCSVContent(){
        $scope.csvContent = [];
        var getSecurityDefectListURL = '/api/v2/security/defectAll';
        return $http.get(getSecurityDefectListURL,{
        }).then(function(results){
            if(isHttpResultOK(results)){
                var result = results.data.rows;
                if(result.length === 0){
                    pushNoDefect();
                    return ;
                }
                angular.forEach(result, function (defect) {
                    pushDefect(defect);
                });
                return ;
            }
        })
    }

    function setSecuritySnapshotCSVContent(){
        $scope.csvSnapshotContent = [];
        var getSecuritySnapshotDefectListURL = '/api/v2/security/snapshotAll';
        return $http.get(getSecuritySnapshotDefectListURL, {
            params: {
                'snapshotId': $scope.snapshotId
            }
        }).then(function(results){
            if(isHttpResultOK(results)){
                var result = results.data.rows;
                if(result.length === 0){
                    pushNoSnapshotDefect();
                    return ;
                }
                angular.forEach(result, function(snapshotDefect){
                    pushSnapshotDefect(snapshotDefect);
                });
                return ;
            }
        })
    }

    $scope.loadFileTreeFromDB = function (btnID) {
        if (btnID !== 'showFileTreeBtn') {
            return;
        }
        if ($scope.isFileTreeHidden === true) {
            loadTreeItem();
        }
        toggleFileTreeAnimation(!$scope.isFileTreeHidden);
        toggleShowFileTreeBtn(!$scope.isFileTreeHidden);
    };

    function loadTreeItem() {
        $scope.fileTree = [];
        loadTreeItemFromDB('project', 'project');
    }

    function loadTreeItemFromDB(state, type) {
        $http.get('/api/v2/defect/status/' + state, {
            params: {
                statusCode: $scope.search.statusCode
            }
        }).then(function (results) {// success
            if (isHttpResultOK(results)) {
                var data = results.data.rows[0];
                $scope.treeItem = {
                    'name': data.modulePath,
                    'label': data.modulePath + ' (' + data.newCount + '/' + data.defectCount + ')',
                    'type': type,
                    'defectCount': data.defectCount,
                    'newCount': data.newCount,
                    'fixCount': data.fixCount,
                    'excCount': data.excCount,
                    'children': []
                };
                if (type === 'project') {
                    $scope.fileTree.splice(0, 0, $scope.treeItem);
                }
            }
        }, function (results) {
            $log.error('Error: ' + results.data + '; ' + results.status);
        });
    }

    $scope.$watch('fileTreeId.currentNode', function () {
        if ($scope.fileTreeId.currentNode === undefined) {
            return;
        }
        var currentNode = $scope.fileTreeId.currentNode;
        loadTreeChildren(currentNode);
    }, false);

    function loadTreeChildren(node) {
        var modulePath = "";
        var fileName = "";
        switch (node.type) {
            case 'project':
                loadModuleTreeFromDB('modulePath', 'module', node.name);
                break;
            case 'module':
                var modulePath = node.name;
                loadFileTreeFromDB('fileName', 'file', modulePath);
                break;
            case 'file':
                var modulePath = node.modulePath;
                var fileName = node.name;
                break;
        }
        setModulePathAndFileNameInSearch(modulePath, fileName);
        goPageInNgGrid(1);
        showDefects();
    }

    var loadFileTreeFromDB = function (state, type, modulePath) {
        var url = '/api/v2/defect/status/' + state;
        $http.get(url, {
            params: {
                modulePath: modulePath
            }
        }).then(function (results) {// success
            if (isHttpResultOK(results)) {
                if ($scope.fileTreeId.currentNode.children !== [])
                    $scope.fileTreeId.currentNode.children = [];

                angular.forEach(results.data.rows, function (data) {
                    $scope.fileTreeId.currentNode.children.push({
                        'name': data.fileName,
                        'label': data.fileName + ' (' + data.newCount + '/' + data.defectCount + ')',
                        'type': type,
                        'modulePath': data.modulePath,
                        'defectCount': data.defectCount,
                        'newCount': data.newCount,
                        'fixCount': data.fixCount,
                        'excCount': data.excCount,
                        'children': []
                    });
                });
            }
        }).catch(console.error);
    };

    var loadModuleTreeFromDB = function (state, type) {
        var url = '/api/v2/defect/status/' + state;
        $http.get(url, {
            params: {
                statusCode: $scope.search.statusCode
            }
        }).then(function (results) {// success
            if (isHttpResultOK(results)) {
                if ($scope.fileTreeId.currentNode.children !== [])
                    $scope.fileTreeId.currentNode.children = [];

                angular.forEach(results.data.rows, function (data) {
                    $scope.fileTreeId.currentNode.children.push({
                        'name': data.modulePath,
                        'label': data.modulePath + ' (' + data.newCount + '/' + data.defectCount + ')',
                        'type': type,
                        'defectCount': data.defectCount,
                        'newCount': data.newCount,
                        'fixCount': data.fixCount,
                        'excCount': data.excCount,
                        'children': []
                    });
                });
            }
        }).catch(console.error);
    };

    function toggleShowFileTreeBtn(isShowState) {
        $scope.isFileTreeHidden = isShowState;
        $scope.isFileTreeBtnTitleHidden = ((isShowState === true) ? 'Show File Tree' : 'Hide File Tree');
    }

    function checkLogin() {
        $http.get("/api/v1/accounts/checkLogin", {
        }).then(function (results) {
            if (results.data.userId) {
                $scope.isHideLoginBtnTitle = results.data.userId + "/ logout";
            }
            else {
                $scope.isHideLoginBtnTitle = 'Login';
            }
        }, function (results) {
            $log.error(results);
        });
    }

    function initLocalStorage() {
        window.localStorage['pageSize'] = (window.localStorage['pageSize']) || 500;
        window.localStorage['currentPage'] = parseInt(window.localStorage['currentPage']) || 1;
    }

    function getProjectName() {
        $http.get('/api/v1/projectName', {}).then(function (result) {
            if (result && result.data) {
                var html = 'Defect : ' + result.data.projectName;
                $scope.projectName = result.data.projectName;
                $('#indexTitle').html(html);
            }
        }, function (results) {
            $log.error(results);
        });
    }

    function moveTopOfPage() {
        $location.hash('bookmark');
        $anchorScroll();
    }

    function removeLocalStorageOfResources() {
        window.localStorage.removeItem('modulePath');
        window.localStorage.removeItem('fileName');
        window.localStorage.removeItem('selectTree');
    }

    var resetAdminUserFlag = function () {
        $scope.isAdminUser = false;
        $scope.isCurrentLoginId = false;
    };

    moveTopOfPage();
    resetAdminUserFlag();

    $scope.isFileTreeHidden = true;
    $scope.isLoginBtnHidden = true;
    $('#animatiroonTab').css('display', 'none');
    $('#animationTab').css('left', document.body.clientWidth);

    $scope.isFileTreeBtnTitleHidden = 'Show File Tree';
    $scope.isHideLoginBtnTitle = 'Login';


    $scope.deselectSelectionList = function () {
        $scope.defectSelections.length = 0;
        window.localStorage.removeItem('defectSelections');
        deselectSelectionDefectList();
    };

    /* all of the alert MSG */
    var hideDefectAlertMSG = function () {
        angular.element('#showDefectAlert').hide();
    };

    var showDefectAlertMSG = function (_str, _status) {
        var alertStatus = _status;
        var status = _status;
        status = (status == 'success') ? 'glyphicon-ok' : 'glyphicon-exclamation-sign';
        alertStatus = (alertStatus == 'success') ?  'alert-success' : 'alert-warning';
        var showAlertDefectMSG = "<a class='close' data-dismiss='alert' aria-hidden='true'><div class='defect-alert " + alertStatus + " fade in'>" +
            "x </a><span class='glyphicon " + status + "'>&nbsp;</span><strong></strong>" + _str + " </strong></div>";
        angular.element('#showDefectAlert').show().html(showAlertDefectMSG);
    };

    function successLogin(results) {
        $scope.isAdminUser = results.isAdmin;
        if (!$scope.isAdminUser) {
            $('#adminBtn').css({display: 'none'});
        }
        $scope.isCurrentLoginId = true;
        $scope.isLoginBtnHidden = true;
        $scope.currentLoginId = results.userId;
        $scope.isHideLoginBtnTitle = $scope.currentLoginId + "/ logout";

        var str = "You have successfully logged in of Dexter Web. Welcome : " + $scope.currentLoginId + ". ";
        angular.element('#showDefectAlert').html(showDefectAlertMSG(str, 'success'));
        setTimeout(hideDefectAlertMSG, 5000);
    }

    function successAdminLogin(results) {
        $scope.currentLoginId = results.userId;
        $scope.isHideLoginBtnTitle = $scope.currentLoginId + "/ logout";
        openAdminPage();
    }

    $scope.checkLogin = function () {
        if ($scope.currentLoginId === undefined) {
            $http.get("/api/v1/accounts/checkWebLogin", {}).then(function (results) {
                if (results.data.userId) {
                    successLogin(results.data);
                } else {
                    var str = "Please check Your ID or PW and use the Dexter account.";
                    angular.element('#showDefectAlert').html(showDefectAlertMSG(str, 'error'));
                    setTimeout(hideDefectAlertMSG, 5000);
                }
            }, function (results) {
                $log.error(results);
            });
        } else {
            $scope.isLoginBtnHidden = true;
            alert("Do you really want to logout on Dexter Web?");
            $scope.isHideLoginBtnTitle = 'Login';
            logout();
        }
    };

    var openAdminPage = function () {
        window.open('../admin', 'Dexter Admin Configuration', 'width=1204 height=580 left=50% top=50%');
    };

    $scope.checkAdmin = function () {
        $http.get("/api/v1/accounts/checkAdmin", {}).then(function (results) {
            if (results.data.isAdmin) {
                successAdminLogin(results.data);
            } else {
                var str = "Please use Dexter Admin Account.";
                angular.element('#showDefectAlert').html(showDefectAlertMSG(str, 'error'));
                setTimeout(hideDefectAlertMSG, 5000);
            }
        }, function (results) {
            $log.error(results);
        });

    };

    $scope.$watch('currentUserId', function (newVal, oldVal) {
        if (oldVal == 'undefined') {
            $scope.isLoginBtnHidden = false;
        }
        if (newVal !== oldVal) {
            $scope.isCurrentLoginId = true;
            $scope.currentUserId = newVal;
            $scope.isHideLoginBtnTitle = $scope.currentUserId + "/ logout";
        }
    }, true);


    function logout() {
        var xmlHttp;
        if (window.XMLHttpRequest) {
            xmlHttp = new XMLHttpRequest();
        }
        if (window.ActiveXObject) {
            document.execCommand("ClearAuthenticationCache");
            window.location.href = '#';
        } else {
            xmlHttp.open('GET', '/api/v1/accounts/logout', true, 'logout', 'logout');
            xmlHttp.send('');
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState == 4) {
                    window.location.href = '#';
                    var str = "You have been logged out of Dexter Web. ";
                    angular.element('#showDefectAlert').html(showDefectAlertMSG(str, 'error'));
                    setTimeout(hideDefectAlertMSG, 5000);
                }
            }
        }
        return false;
    }

    $scope.currentFileList = [];

    function toggleFileTreeAnimation(isShowState) {
        if (isShowState === true) {
            $('#animationTab').hide();
        } else {
            var calculateLeft = document.body.clientWidth - 598;
            $('#animationTab')
                .css('display', 'block')
                .animate({left: calculateLeft})
                .css('left', document.body.clientWidth);
        }
    }


    $scope.isDetailTabHidden = false;
    $scope.isButtonHidden = true;
    $scope.didList = [];

    //only administrator
    var fixSelectedItem = function () {
        $scope.didList = [];
        for (var i = 0; i < $scope.defectSelections.length; i++) {
            if ($scope.defectSelections[i].statusCode != 'FIX') {
                $scope.didList[i] = $scope.defectSelections[i].did;
                dismissSelectedDefect($scope.defectSelections[i].did, true);
            }
        }
        $http.post('/api/v1/defect/changeFix', {
            params: {
                didList: $scope.didList
            }
        }).then(function (results) {
            // success
            if (results && results.data) {
                for (var i = 0; i < results.data.length; i++) {
                    var data = results.data[i];
                    $scope.fileTree.splice(i, 0, moduleItem);
                }
            }
            //$scope.defectSelections.length = 0;
            var str = 'Success to Apply for changed.';
            angular.element('#showDefectAlert').html(showDefectAlertMSG(str, 'success'));
            setTimeout(hideDefectAlertMSG, 5000);
            showDefects();
        }, function (results) {
            // error
            $log.error('Error: ' + results.data + ';' + results.status);
            var str = 'An unexpected error has occurred, It is not changed status of defects. ';
            angular.element('#showDefectAlert').html(showDefectAlertMSG(str, 'error'));
            setTimeout(hideDefectAlertMSG, 5000);
        });
    };

    $scope.changeDefectStatus = function (defectStatus) {
        $http.post("/api/v1/defect/" + defectStatus, {
            params: {
                didList: $scope.didList
            }
        }).then(function (results) {
            if (results && results.data) {
                for (var i = 0; i < results.data.length; i++) {
                    var data = results.data[i];
                    $scope.fileTree.splice(i, 0, moduleItem);
                }
            }
            var str = "Success to Apply for changed. ";
            angular.element('#showDefectAlert').html(showDefectAlertMSG(str, 'success'));
            setTimeout(hideDefectAlertMSG, 5000);
            showDefects();
        }, function (results) {
            // error
            $log.error("Error: " + results.data + "; " + results.status);
            var str = "An unexpected error has occurred, It isn't changed status of defects. ";
            angular.element('#showDefectAlert').html(showDefectAlertMSG(str, 'error'));
            setTimeout(hideDefectAlertMSG, 5000);
        });
    };

    var markDefectStatusByjQuery = function (state) {
        $scope.didList = [];
        $scope.didList[0] = $scope.currentDetailDid;
        $scope.changeDefectStatus(state);

    };

    $scope.markDefectStatusByAngular = function (state) {
        if ($scope.defectSelections.length == 0) {
            $log.info("need to select items");
            return;
        }
        $scope.didList = [];
        var selectedItem = $scope.defectSelections;

        for (var i = 0, len = selectedItem.length; i < len; i++) {

            if (selectedItem[i].statusCode != "EXC" || selectedItem[i].statusCode != "NEW") {
                $scope.didList[i] = selectedItem[i].did;
                dismissSelectedDefect(selectedItem[i].did, true);
            }
        }
        $scope.changeDefectStatus(state);
    };

    $scope.removeDefectFromDB = function () {
        $scope.fileList = [];
        if (window.localStorage['fileName'] != '') {
            if (confirm("Did you remove [" + window.localStorage['modulePath'] + "/" + window.localStorage['fileName'] + " ] file in workspace?")) {
                $scope.fileList = window.localStorage['fileName'].split(' ');
                $http.post("/api/v1/filter/delete-file-tree", {
                    params: {
                        modulePath: base64.encode(window.localStorage['modulePath']),
                        fileList: $scope.fileList
                    }
                }).then(function (results) {
                    $scope.loadFileTreeFromDB('removeFileTreeBtn');
                    removeLocalStorageOfResources();
                }, function (results) {
                });
            }
        }
        else {
            var str = "Please select any module or file in File Tree. ";
            angular.element('#showDefectAlert').html(showDefectAlertMSG(str, 'error'));
            setTimeout(hideDefectAlertMSG, 5000);
        }
    };

    $scope.fileTree = [];

    function goPageInNgGrid(page) {
        $scope.pagingOptions.currentPage = page;
    }

    function showDefects() {
        loadTotalDefectInformation();
    }

    function setModulePathAndFileNameInSearch(modulePath, fileName) {
        $scope.search.modulePath = modulePath;
        $scope.search.fileName = fileName;
    }


    var dismissSelectedDefect = function (did, isActive) {
        if (isActive == true) {
            $http.post('/api/v1/filter/false-alarm', {
                params: {did: did}
            }).then(function (results) {
                $log.info('dismissSelectDefect');
                $log.debug(results.data);
            }, function (results) {
                $log.error(results.data + results.status);
            });
        } else {
            $http.post('/api/v1/filter/delete-false-alarm', {
                params: {did: did}
            }).then(function (results) {
                $log.info('deleteDismissSelectDefect');
                $log.debug(results.data);
            }, function (results) {
                $log.error(results.data + results.status);
            });
        }
    };

    $scope.getOnlyClassName = function (className) {
        if (className == null) {
            return "";
        }
        else {
            var start = className.lastIndexOf(".") + 1;
            return className.substring(start);
        }
    };


    $scope.isStatusNotNew = function (value) {
        return (value == 'EXC') || (value == 'FIX');
    };

    $scope.isStatusNew = function (value) {
        return value == 'NEW';
    };

    $scope.isMajor = function (value) {
        return value == 'CRI';
    };

    $scope.isSecurity = function (value) {
        return value == SECURITY_CHECKER;
    };

    $scope.isTooLate = function (value) {
        var valueDate = new Date(value);
        var today = new Date();
        var diff = today.getTime() - valueDate.getTime();
        return (diff / (60 * 60 * 24 * 1000)) > 5;
    };

    $scope.filterOptions = {
        filterText: '',
        useExternalFilter: false
    };

    $scope.totalServerItems = 0;

    window.localStorage['pageSize'] = (window.localStorage['pageSize']) || 1000;
    window.localStorage['currentPage'] = parseInt(window.localStorage['currentPage']) || 1;

    $scope.pagingOptions = {
        pageSizes: [250, 500, 1000, 2500],
        pageSize: window.localStorage['pageSize'],
        currentPage: parseInt(window.localStorage['currentPage'])
    };

    $scope.$watch('pagingOptions', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            showDefects();
            $scope.newCurrentPage = parseInt($scope.totalServerItems / $scope.pagingOptions.pageSize) + 1;
            if ($scope.pagingOptions.currentPage > $scope.newCurrentPage) {
                $scope.pagingOptions.currentPage = $scope.newCurrentPage;
            }
            window.localStorage['pageSize'] = $scope.pagingOptions.pageSize;
            window.localStorage['currentPage'] = $scope.pagingOptions.currentPage;
        }
    }, true);

    var rowHeight = 28;
    var headerHeight = 30;


    function loadTotalDefectInformation() {
        if ($scope.isSnapshotView) {
            showSnapshotDefectPage();
        }
        else {
            showDefectPage();
        }
    }

    function showSnapshotDefectPage() {
        setSnapshotColumnField();
        var snapshotId = $scope.snapshotId;
        var url = '/api/v2/snapshot/' + snapshotId;
        $http.get(url, {}).then(function (results) {
            if (results && results.data) {
                $scope.defectList = results.data.defectInSnapshot;
                $scope.totalServerItems = results.data.length;
                angular.element('#showLoading').hide();
                //setCSVContent('snapshot');
                //setSecurityCSVContent('snapshot');
            } else {
                $log.debug(results);
            }
        }, function (results) {
            $log.error(results.status);
        });
    }

    function showDefectPage() {
        var defectParams = {
            'did': $scope.search.did,
            'modulePath': base64.encode($scope.search.modulePath),
            'fileName': $scope.search.fileName,
            'statusCode': $scope.search.statusCode,
            'severityCode': $scope.search.severityCode,
            'categoryName': $scope.search.categoryName,
            'checkerCode': $scope.search.checkerCode,
            'modifierNo': $scope.search.modifierNo,
            'currentPage': $scope.pagingOptions.currentPage,
            'pageSize': $scope.pagingOptions.pageSize
        };

        $http.get('/api/v1/defect/count', {
            params: defectParams
        }).then(function (results) { // success
            if (results && results.data) {
                $scope.totalServerItems = results.data.defectCount;
            }
        }, function (results) { // error
            $log.error(results.status);
        });

        $http.get('/api/v2/defect', {
            params: defectParams
        }).then(function (results) { // success
            if (results && results.data) {
                $scope.defectList = results.data;
                angular.element('#showLoading').hide();
                //setSecurityCSVContent('defect');
            }
        }, function (results) { // error
            $log.error(results.status);
        });
    }

    var setSnapshotColumnField = function () {
        angular.forEach($scope.gridOptions.columnDefs, function (obj) {
            if (obj.field === 'currentStatusCode') {
                obj.visible = true;
                obj.cellTemplate = '<div ng-class="{greenBG: isStatusNotNew(row.getProperty(col.field))}"><div class="ngCellText">{{row.getProperty(col.field)}}</div></div>';
            }
            if (obj.field === 'statusCode') {
                obj.displayName = 'snap.Status';
                obj.cellTemplate = '<div class="ngCellText">{{row.getProperty(col.field)}}</div>';
            }
        });
    };


    $scope.gridOptions = {
        data: 'defectList',
        selectedItems: $scope.defectSelections,
        multiSelect: true,
        enablePaging: true,
        showFooter: true,
        enablePinning: true,
        enableColumnResize: true,
        enableColumnReordering: true,
        enableRowSelection: true,
        enableRowReordering: true,
        totalServerItems: 'totalServerItems',
        pagingOptions: $scope.pagingOptions,
        filterOptions: $scope.filterOptions,
        headerRowHeight: headerHeight,
        rowHeight: rowHeight,
        showGroupPanel: true,
        showColumnMenu: true,
        showFilter: true,
        showSelectionCheckbox: true,
        canSelectRows: true,
        afterSelectionChange: function (item) {
            $scope.selectedDidInNgGrid = item.entity;
        },
        jqueryUIDraggable: false,
        columnDefs: [
            {field: 'did', displayName: 'ID', width: 80, cellClass: 'textAlignCenter'},
            {field: 'checkerCode', displayName: 'Checker'},
            {
                field: 'occurenceCount',
                displayName: 'Count',
                width: 70,
                resizable: true,
                cellClass: 'textAlignCenter',
                cellTemplate: '<div ng-class="{redBG: row.getProperty(col.field) >= 10}"><div class="ngCellText">{{row.getProperty(col.field)}}</div></div>'
            },
            {field: 'occurenceLine', displayName: 'Line No.', width: 70, resizable: true},
            {
                field: 'severityCode',
                displayName: 'Severity',
                width: 70,
                resizable: true,
                cellClass: 'textAlignCenter',
                cellTemplate: '<div ng-class="{redFG: isMajor(row.getProperty(col.field))}"><div class="ngCellText">{{row.getProperty(col.field)}}</div></div>'
            },
            {
                field: 'statusCode',
                displayName: 'Status',
                width: 80,
                resizable: true,
                cellClass: 'textAlignCenter',
                cellTemplate: '<div ng-class="{redBG: isStatusNew(row.getProperty(col.field))}"><div class="ngCellText">{{row.getProperty(col.field)}}</div></div>'
            },
            {
                field: 'currentStatusCode',
                visible: false,
                displayName: 'cur.Status',
                width: 82,
                resizable: true,
                cellClass: 'textAlignCenter',
                cellTemplate: '<div class="ngCellText">{{row.getProperty(col.field)}}</div>'
            },
            {
                field: 'categoryName',
                displayName: 'Category',
                width: 80,
                resizable: true,
                cellClass: 'textAlignCenter',
                cellTemplate: '<div ng-class="{yellowBlackBG: isSecurity(row.getProperty(col.field))}"><div class="ngCellText">{{row.getProperty(col.field)}}</div></div>'
            },
            {
                field: 'modulePath',
                displayName: 'Module',
                width: 250,
                resizable: true,
                cellFilter:'nullModuleFilter',
                cellTemplate: '<div class="ngCellText">{{row.getProperty(col.field)}}</div>'
            },
            {
                field: 'fileName',
                displayName: 'File',
                resizable: true,
                cellTemplate: '<div class="ngCellText">{{row.getProperty(col.field)}}</div>'
            },
            {
                field: 'className',
                displayName: 'Class',
                resizable: true,
                cellFilter:'nullClassFilter',
                cellTemplate: '<div class="ngCellText">{{getOnlyClassName(row.getProperty(col.field))}}</div>'
            },
            {field: 'methodName', displayName: 'Method/Function', resizable: true, cellFilter:'nullMethodFilter'},
            {
                field: 'language',
                displayName: 'Language',
                cellClass: 'textAlignCenter',
                width: 85,
                resizable: true,
                cellclass: 'textAlignCenter'
            },
            {
                field: 'toolName',
                displayName: 'Tool',
                visible: false,
                cellClass: 'textAlignCenter',
                width: 85,
                resizable: true,
                cellclass: 'textAlignCenter'
            },
            {field: 'modifierId', displayName: 'Author', resizable: true, cellClass: 'textAlignCenter'},
            {
                field: 'modifiedDateTime', displayName: 'Date', resizable: true, cellClass: 'textAlignCenter',
                cellTemplate: '<div><div class="ngCellText">{{row.getProperty(col.field) | date:"yyyy-MM-dd HH:mm:ss"}}</div></div>'
            },
            {field: 'message', displayName: "Description", visible: false, resizable: true}
        ]
    };
    showDefects();


    $scope.selectDefectRow = function () {
        if (window.localStorage['defectSelections'] === undefined) {
            return;
        }
        var localDid = [];
        var defectSelections = window.localStorage['defectSelections'];
        localDid = defectSelections.split(',');
        $scope.gridOptions.selectAll(false);
        angular.forEach(localDid, function (_did) {
            angular.forEach($scope.defectList, function (data, index) {
                if (data.did == _did) {
                    $scope.gridOptions.selectRow(index, true);
                }
            })
        });
    };

    $scope.$on('ngGridEventData', function () {
        if ($scope.totalServerItems === 0) {
            return;
        }
        $scope.selectDefectRow();
    });

    var deselectSelectionDefectList = function () {
        $scope.gridOptions.selectAll(false);
    };

    document.onkeydown = fkey;
    document.onkeypress = fkey;
    document.onkeyup = fkey;

    var wasPressed = false;

    function fkey(e) {
        e = e || window.event;
        if (wasPressed) {
            return;
        }
        if (e.keyCode == 116) {
            wasPressed = true;
        }
    }

    $scope.selectedDidListInGrid = [];

    $scope.$watch('defectSelections.length', function (newVal, oldVal) {
        if ($scope.defectSelections.length === 0) {
            window.localStorage['defectSelections'] = '';
            $scope.selectedDidListInGrid = [];
            $scope.isDetailTabHidden = true;
            initCurrentState();
            return;
        }

        if (newVal > oldVal) {
            $scope.selectedDidListInGrid.push($scope.selectedDidInNgGrid.did);
            window.localStorage['defectSelections'] = $scope.selectedDidListInGrid;
            var len = $scope.defectSelections.length - 1;
            storeCurrentDefectInfo($scope.defectSelections[len]);
            $scope.setCurrentDetail($scope.defectSelections[len].checkerCode, $scope.defectSelections[len].did);
        }
        else {
            angular.forEach($scope.selectedDidListInGrid, function (obj, index) {
                if (obj == $scope.selectedDidInNgGrid.did) {
                    $scope.selectedDidListInGrid.splice(index, 1);
                }
            });
            window.localStorage['defectSelections'] = $scope.selectedDidListInGrid;
        }
    });

    function initCurrentState() {
        $scope.tempDidList = [];
        $scope.defectOccurenceInformations = [];
        $scope.cntK = [];
        $scope.selectedDefect = '';
        //$scope.defectSourceCodes = [];
        $scope.defectOccurrences = [];
        $scope.defectDescriptions = [];
    }

    var storeCurrentDefectInfo = function (currentDefect) {
        $scope.currentDetailDid = currentDefect.did;
        $scope.currentDetailModulePath = currentDefect.modulePath || 'undefined';
        $scope.currentDetailFileName = currentDefect.fileName;
        $scope.currentDetailCheckerCode = currentDefect.checkerCode;
        $scope.currentDetailSeverityCode = currentDefect.severityCode;
        $scope.currentDetailCategoryName = currentDefect.categoryName;
        $scope.currentDetailOccurenceCount = currentDefect.occurenceCount || 'undefined';
        $scope.currentDetailStatus = currentDefect.statusCode;
        $scope.currentDetailClassName = currentDefect.className || 'undefined';
        $scope.currentDetailMethodName = currentDefect.methodName || 'undefined';
        $scope.currentDetailModifierId = currentDefect.modifierId;
        $scope.currentDetailModifiedDateTime = currentDefect.modifiedDateTime;
        $scope.currentDetailmessage = currentDefect.message;
    };

    var hideDetailTab = function () {
        ($scope.isDetailTabHidden == true) && ($scope.isDetailTabHidden = false);
        ($scope.isButtonHidden == true) && ($scope.isButtonHidden = false);
    };


    var createHelpHtmlURL = function (selectedDefect) {
        if (selectedDefect.hasOwnProperty('checkerCode')) {
            var defectDescriptionUrl = '/tool/'
                + selectedDefect.toolName + "/"
                + selectedDefect.language + "/help/"
                + selectedDefect.checkerCode + ".html";
        }
        return defectDescriptionUrl;
    };

    var getHelpDescription = function (selectedDefect, defectDescriptionUrl, checkerCode) {
        $http.get(defectDescriptionUrl)
            .then(function (results) {
                if (results) {
                    getCheckerDescription(results.data, results.config.checkerCode);
                }
            }, function () {
                $http.get('/tool/NotFoundCheckerDescription/empty_checker_description.html')
                    .success(function (results) {
                        if (results) {
                            getCheckerDescription(results, checkerCode);
                        }
                    });
            });
    };

    var getCheckerDescription = function (results, checkerCode) {
        $scope.defectDescriptions = [];
        var defectDescription = {"checkerCode": checkerCode, "description": $sce.trustAsHtml(results)};
        $scope.currentChecker = checkerCode;
        $scope.defectDescriptions.splice($scope.defectDescriptions.length, 0, defectDescription);
        $scope.currentDetailDescription = $scope.defectDescriptions[0].description;
    };

    var getDefectOccurrenceInFile = function (selectedDefect) {
        $scope.selectedDefectModulePath = (selectedDefect.modulePath) || "undefined";

        var snapshotId = '';
        if ($scope.isSnapshotView) {
            snapshotId = $scope.snapshotId;
            getSnapshotOccurenceInFile();
        }
        else {
            snapshotId = 'undefined';
            getOccurenceInFile(selectedDefect);

        }
        checkSourceCode(selectedDefect, snapshotId);
    };

    var setSelectedDidDetail = function (defectOccurrence) {
        $scope.currentDetailDefectList = [];
        angular.forEach(defectOccurrence, function (defect, idx) {
            if (defect.did === $scope.currentDetailDid) {
                var tempDefect = [];
                tempDefect.did = defect.did;
                tempDefect.variableName = defect.variableName;
                tempDefect.stringValue = defect.stringValue;
                tempDefect.fieldName = defect.fieldName;
                tempDefect.startLine = defect.startLine;
                tempDefect.endLine = defect.endLine;
                tempDefect.charStart = defect.charStart;
                tempDefect.charEnd = defect.charEnd;
                $scope.currentDetailDefectList.push(tempDefect);
            }
        });
    };

    var getSnapshotOccurenceInFile = function () {
        const getSnapshotOccurenceInFileUrl = '/api/v2/snapshot/occurence-in-file';

        $http.post( getSnapshotOccurenceInFileUrl , {
            params: {
                'modulePath': base64.encode($scope.currentDetailModulePath),
                'fileName': $scope.currentDetailFileName,
                'snapshotId': $scope.snapshotId
            }
        }).then(function (results) {
            $scope.defectOccurrences = [];
            $scope.defectOccurrences[$scope.currentDetailFileName] = (results.data) || 'undefined';
            setSelectedDidDetail($scope.defectOccurrences[$scope.currentDetailFileName]);
        });
    };

    var getOccurenceInFile = function (selectedDefect) {
        $http.get("/api/v1/occurenceInFile", {
            params: {
                'modulePath': base64.encode($scope.selectedDefectModulePath),
                'fileName': selectedDefect.fileName
            }
        }).then(function (results) {
            $scope.defectOccurrences = [];
            $scope.defectOccurrences[results.config.params.fileName] = (results.data) || 'undefined';
            setSelectedDidDetail($scope.defectOccurrences[results.config.params.fileName]);
        });
    };

    var checkSourceCode = function (selectedDefect, snapshotId) {
        $http.get("/api/v1/analysis/snapshot/checkSourceCode", {
            params: {
                'modulePath': base64.encode($scope.selectedDefectModulePath),
                'fileName': selectedDefect.fileName
            }
        }).then(function (results) {
            if (results) {
                var getCodeMsg = " : Please wait until loading source code";
                var msg = "<pre class='prettyprint linenums'>" + getCodeMsg + "</pre>";
                angular.element('#SourceCodeTab').html(msg);

                if (results.data[0].count > 0) {
                    loadSnapshotSourceCode(selectedDefect, snapshotId);
                } else if (results.data[0].count == 0) {
                    setDefaultMsg();
                }
            }
        });
    };

    var loadSnapshotSourceCode = function (selectedDefect, snapshotId) {
        const getSnapshotSourceCodeUrl = '/api/v2/analysis/snapshot/sourcecode';
        $http.post(getSnapshotSourceCodeUrl , {
            params: {
                'modulePath': base64.encode($scope.selectedDefectModulePath),
                'fileName': selectedDefect.fileName,
                'snapshotId': snapshotId
            }
        }).then(function(results){
           if(isHttpResultOK(results)){
               var defectSourceCodes = {};
               defectSourceCodes.source = results.data;
               defectSourceCodes.fileName = results.config.data.params.fileName;
               defectSourceCodes.modulePath = base64.decode(results.config.data.params.modulePath);
               displaySourceCode(defectSourceCodes);
           }
        });
    };

    var setDefaultMsg = function () {
        var noCodeMsg = "There is no content for source codes. When you use snapshot or CLI, you can see the source codes.";
        var ht = "<pre class='prettyprint linenums'>" + noCodeMsg + "</pre>";
        angular.element('#SourceCodeTab').html(ht);
    };


    $scope.setCurrentDetail = function (checkerCode, did) {
        $("#bookmark").remove();
        // for defect Description
        // $scope.checkerCodeSet = {};
        hideDetailTab();
        var len = $scope.defectSelections.length;
        $scope.selectedDefect = $scope.defectSelections[len - 1];
        var defectDescriptionUrl = createHelpHtmlURL($scope.selectedDefect);
        getHelpDescription($scope.selectedDefect, defectDescriptionUrl, checkerCode);
        getDefectOccurrenceInFile($scope.selectedDefect, did);
    };

    $(document).on('click', '#markFalseDefectSelectedItem', function () {
        markDefectStatusByjQuery('markFalseDefect');
    });
    $(document).on('click', '#markDefectSelectedItem', function () {
        markDefectStatusByjQuery('markDefect');
    });
    $(document).on('click', '#SourceTab', function () {
        moveTopOfPage();
    });

    var checkOccurrenceLine = function (currentStartLine, k) {
        commentIndex1 = [];
        commentIndex2 = [];

        commentIndex1[k] = (currentStartLine) / 10;
        commentIndex2[k] = ((currentStartLine) % 10) - 1;

        (commentIndex1[k] == 0 && commentIndex2[k] == -1) && (commentIndex2[k] = 0);
        if (commentIndex1[k] != 0 && commentIndex2[k] == -1) {
            commentIndex1[k] = commentIndex1[k] - 1;
            commentIndex2[k] = 9;
        }
    };

    var addDefectComment = function () {
        var comment = {};
        $scope.cntK = [];

        if($scope.defectOccurrences[$scope.currentDetailFileName].length < 0 ){
            return;
        }

        for (var k = 0; k < $scope.defectOccurrences[$scope.currentDetailFileName].length; k++) {
            var curDefectOccurrenceInFile = $scope.defectOccurrences[$scope.currentDetailFileName][k];
            $scope.cntK[k] = k + 1;
            var currentStartLine = curDefectOccurrenceInFile.startLine;
            var currentSourceMSG = curDefectOccurrenceInFile.message;

            $scope.defectOccurenceInformations[k] = curDefectOccurrenceInFile;
            if ($scope.defectOccurenceInformations[k].modifierId == null) {
                $scope.defectOccurenceInformations[k].modifierId = $scope.currentDetailModifierId;
            }

            if (curDefectOccurrenceInFile.did === $scope.currentDetailDid) {
                curDefectOccurrenceInFile.modifiedId = (curDefectOccurrenceInFile.modifiedId) || $scope.currentDetailModifierId;
                $scope.currentDidStartLine = curDefectOccurrenceInFile.startLine;
                $scope.currentDidEndLine = curDefectOccurrenceInFile.endLine;
                $scope.currentDidSourceMSG = curDefectOccurrenceInFile.message;

                var moveTopOfPageBtn = $('.topOfPageDummy').clone(true);
                moveTopOfPageBtn.removeClass('topOfPageDummy').attr('id', 'moveTopOfPage');

                var defectBtn = $('.realDefectDummy').clone(true);
                defectBtn.removeClass('realDefectDummy').attr('id', 'markDefectSelectedItem');

                var falseBtn = $('.falseDefectDummy').clone(true);
                falseBtn.removeClass('falseDefectDummy').attr('id', 'markFalseDefectSelectedItem');

                comment[k] = "<div id='bookmark' class='anchor'>" + moveTopOfPageBtn[0].outerHTML;
                comment[k] += " / " + defectBtn[0].outerHTML + " / " + falseBtn[0].outerHTML;
                comment[k] += setCurrentDefectComment(k, curDefectOccurrenceInFile, currentSourceMSG);
            }
            else {
                comment[k] = setReferenceDefectComment(k, curDefectOccurrenceInFile, currentSourceMSG);
            }
            checkOccurrenceLine(currentStartLine, k);
            $("#SourceCodeTab .L" + commentIndex2[k]).each(function (index) {
                if (index == parseInt(commentIndex1[k])) {
                    $(this).before(comment[k]);
                }
            });
            moveTopOfPage();
        }
    };

    var setCurrentDefectComment = function (index, curDefectOccurrenceInFile, currentSourceMSG) {
        var comment = "<span class='nocode annotCheck' style='display:inline-block' width:100%><span class='glyphicon glyphicon-star'></span>" +
            "&nbsp;DID: <strong>" + curDefectOccurrenceInFile.did + "</strong>&nbsp;(" +
            $scope.cntK[index] + " of " + $scope.defectOccurrences[$scope.currentDetailFileName].length +
            ")&nbsp;" + "<strong>[" + curDefectOccurrenceInFile.severityCode + " /</strong> Checker: <strong>" +
            curDefectOccurrenceInFile.checkerCode + "]</strong><br>: &nbsp;" + currentSourceMSG + "&nbsp;</span></div>";
        return comment;
    };

    var setReferenceDefectComment = function (index, curDefectOccurrenceInFile, currentSourceMSG) {
        var comment = "<div><span class='nocode annot' style='display:inline-block' width:100%>"
            + "<span class='glyphicon glyphicon-star-empty'></span>&nbsp;DID: <strong>" + curDefectOccurrenceInFile.did + "</strong>&nbsp;("
            + $scope.cntK[index] + " of " + $scope.defectOccurrences[$scope.currentDetailFileName].length
            + ")&nbsp;" + "<strong>[" + curDefectOccurrenceInFile.severityCode + " /</strong> Checker: <strong>"
            + curDefectOccurrenceInFile.checkerCode + "]</strong><br>: &nbsp;" + currentSourceMSG + "&nbsp;</span></div>";
        return comment;
    };

    var displaySourceCode = function (sourceCode) {
        if (sourceCode < 1) {
            return;
        }
        var source = sourceCode.source.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        var ht = "<pre class='prettyprint linenums'>" + source + "</pre>";
        angular.element('#SourceCodeTab').html(ht);
        prettyPrint();
        addDefectComment();
    };
});

defectApp.filter('nullMethodFilter', function() {
    return function(input) {
        return input == 'null' ? 'N/A' : input;
    };
});

defectApp.filter('nullModuleFilter', function() {
    return function(input) {
        return input == 'null' ? 'N/A' : input;
    };
});
defectApp.filter('nullClassFilter', function() {
    return function(input) {
        return input == 'null' ? 'N/A' : input;
    };
});
