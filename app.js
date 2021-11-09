(function () {
    'use strict'; 

    angular.module('BBPCapa', [])
    .controller('BbpController', BbpController)
    .service('BbpService', BbpService);
    
    BbpController.$inject = ['BbpService'];
    function BbpController(BbpService) {
        let bbpList = this;

        bbpList.Filename = 'bla';
        bbpList.loadComplete = false;
        bbpList.showTrack = '';
        bbpList.FromDate = '';
        bbpList.ToDate = '';
        bbpList.EditRow = '';
        bbpList.redLv3 = -1;
        bbpList.redLv4 = -1;

        bbpList.CapaList = [];
        bbpList.TrackAnalysis = [];
        bbpList.LoadAnalysis = [];

        bbpList.findOverload = function(){
            bbpList.TrackAnalysis = [];
            let constructionList = bbpList.CapaList.filter((c) => c.Baustelle !== '0');
            let trNumbers = constructionList.map((c) => c.Streckennummer);
            trNumbers = trNumbers.filter((item, index) => trNumbers.indexOf(item)===index);

            for (let i = 0; i < trNumbers.length; i+=1) {
                let list = constructionList.filter((c) => c.Streckennummer === trNumbers[i] && c.Verkehrsart === 'Alle');
                if(Math.min(...list.map((c) => c['Nennleistung unter Bau']))=== 0){
                    let maxLoad = list.find((c) => c['Nennleistung unter Bau'] === 0);
                    let spfv = constructionList.find((c) => c.Streckennummer === maxLoad.Streckennummer && 
                                         c['Von Betriebsstelle'] === maxLoad['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === maxLoad['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === maxLoad.Datum.DNumber && c.Verkehrsart === 'SPFV');
                    let spnv = constructionList.find((c) => c.Streckennummer === maxLoad.Streckennummer && 
                                         c['Von Betriebsstelle'] === maxLoad['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === maxLoad['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === maxLoad.Datum.DNumber && c.Verkehrsart === 'SPNV');
                    let sgv = constructionList.find((c) => c.Streckennummer === maxLoad.Streckennummer && 
                                         c['Von Betriebsstelle'] === maxLoad['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === maxLoad['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === maxLoad.Datum.DNumber && c.Verkehrsart === 'SGV');
                    bbpList.TrackAnalysis.push({
                        'Strecke': maxLoad.Streckennummer,
                        'MaxLoad': maxLoad['Anzahl Züge Fahrplan']>0 ? 999999 : 0,
                        'Level': maxLoad['Anzahl Züge Fahrplan']>0 ? {'Lv': 6, 'Col': "#B20000"} : {'Lv': 1, 'Col': "#0087B9"},
                        'From': maxLoad['Von Betriebsstelle'],
                        'To': maxLoad['Bis Betriebsstelle'],
                        'Nennleistung': maxLoad['Nennleistung unter Bau'],
                        'SPFV': spfv['Anzahl Züge Fahrplan'],
                        'SPNV': spnv['Anzahl Züge Fahrplan'],
                        'SGV': sgv['Anzahl Züge Fahrplan']
                    });
                }else{
                    let maxLoad = Math.max.apply(null, list.map((c) => c['Auslastung Fahrplan unter Bau']));
                    maxLoad = list.find((c) => c['Auslastung Fahrplan unter Bau'] === maxLoad);                    
                    let spfv = constructionList.find((c) => c.Streckennummer === maxLoad.Streckennummer && 
                                         c['Von Betriebsstelle'] === maxLoad['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === maxLoad['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === maxLoad.Datum.DNumber && c.Verkehrsart === 'SPFV');
                    let spnv = constructionList.find((c) => c.Streckennummer === maxLoad.Streckennummer && 
                                         c['Von Betriebsstelle'] === maxLoad['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === maxLoad['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === maxLoad.Datum.DNumber && c.Verkehrsart === 'SPNV');
                    let sgv = constructionList.find((c) => c.Streckennummer === maxLoad.Streckennummer && 
                                         c['Von Betriebsstelle'] === maxLoad['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === maxLoad['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === maxLoad.Datum.DNumber && c.Verkehrsart === 'SGV');
                    bbpList.TrackAnalysis.push({
                        'Strecke': maxLoad.Streckennummer,
                        'MaxLoad': Math.round(100.0*maxLoad['Auslastung Fahrplan unter Bau']),
                        'Level': getLevel(maxLoad['Auslastung Fahrplan unter Bau']),
                        'From': maxLoad['Von Betriebsstelle'],
                        'To': maxLoad['Bis Betriebsstelle'],
                        'Nennleistung': maxLoad['Nennleistung unter Bau'],
                        'SPFV': spfv['Anzahl Züge Fahrplan'],
                        'SPNV': spnv['Anzahl Züge Fahrplan'],
                        'SGV': sgv['Anzahl Züge Fahrplan']
                    });
                }
            }
            console.log(bbpList.TrackAnalysis[0]);
        };

        bbpList.showDetails = function(track){
            bbpList.LoadAnalysis = [];
            bbpList.FromDate = '';
            bbpList.ToDate = '';
            bbpList.showTrack = track;
            let trackList = bbpList.CapaList.filter((c) => c.Streckennummer === track); 
            let days = trackList.map((c) => c.Datum.DNumber);
            days = days.filter((item, index) => days.indexOf(item)===index).sort();
            bbpList.FromDate = trackList.find((c) => c.Datum.DNumber === days[0]).Datum.DText;
            bbpList.ToDate = trackList.find((c) => c.Datum.DNumber === days[days.length-1]).Datum.DText;
            for (let i = 0; i < days.length; i+=1) {
                let list = trackList.filter((c) => c.Datum.DNumber === days[i] && c.Verkehrsart === 'Alle');
                if(Math.min(...list.map((c) => c['Nennleistung unter Bau']))=== 0){
                    let maxLoad = list.find((c) => c['Nennleistung unter Bau'] === 0);
                    let spfv = trackList.find((c) => c['Von Betriebsstelle'] === maxLoad['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === maxLoad['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === maxLoad.Datum.DNumber && c.Verkehrsart === 'SPFV');
                    let spnv = trackList.find((c) => c['Von Betriebsstelle'] === maxLoad['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === maxLoad['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === maxLoad.Datum.DNumber && c.Verkehrsart === 'SPNV');
                    let sgv = trackList.find((c) => c['Von Betriebsstelle'] === maxLoad['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === maxLoad['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === maxLoad.Datum.DNumber && c.Verkehrsart === 'SGV');

                    bbpList.LoadAnalysis.push({
                        'Date': maxLoad.Datum,
                        'MaxLoad': maxLoad['Anzahl Züge Fahrplan']>0 ? 999999 : 0,
                        'Level': maxLoad['Anzahl Züge Fahrplan']>0 ? {'Lv': 6, 'Col': "#B20000"} : {'Lv': 1, 'Col': "#0087B9"},
                        'From': maxLoad['Von Betriebsstelle'],
                        'To': maxLoad['Bis Betriebsstelle'],
                        'Nennleistung': maxLoad['Nennleistung unter Bau'],
                        'SPFV': spfv['Anzahl Züge Fahrplan'],
                        'SPNV': spnv['Anzahl Züge Fahrplan'],
                        'SGV': sgv['Anzahl Züge Fahrplan']
                    });
                }else{
                    let maxLoad = Math.max.apply(null, list.map((c) => c['Auslastung Fahrplan unter Bau']));
                    maxLoad = list.find((c) => c['Auslastung Fahrplan unter Bau'] === maxLoad);                    
                    let spfv = trackList.find((c) => c['Von Betriebsstelle'] === maxLoad['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === maxLoad['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === maxLoad.Datum.DNumber && c.Verkehrsart === 'SPFV');
                    let spnv = trackList.find((c) => c['Von Betriebsstelle'] === maxLoad['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === maxLoad['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === maxLoad.Datum.DNumber && c.Verkehrsart === 'SPNV');
                    let sgv = trackList.find((c) => c['Von Betriebsstelle'] === maxLoad['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === maxLoad['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === maxLoad.Datum.DNumber && c.Verkehrsart === 'SGV');
                    
                    bbpList.LoadAnalysis.push({
                        'Date': maxLoad.Datum,
                        'MaxLoad': Math.round(100.0*maxLoad['Auslastung Fahrplan unter Bau']),
                        'Level': getLevel(maxLoad['Auslastung Fahrplan unter Bau']),
                        'From': maxLoad['Von Betriebsstelle'],
                        'To': maxLoad['Bis Betriebsstelle'],
                        'Nennleistung': maxLoad['Nennleistung unter Bau'],
                        'SPFV': spfv['Anzahl Züge Fahrplan'],
                        'SPNV': spnv['Anzahl Züge Fahrplan'],
                        'SGV': sgv['Anzahl Züge Fahrplan']
                    });
                }
                
            }
            console.log(bbpList.LoadAnalysis[0]);
            document.getElementById("nav-profile-tab").click();
        };

        bbpList.editRouting =function(track, row){
            bbpList.EditRow = row;
            bbpList.showTrack = track;

            bbpList.redLv3 = Math.ceil((row.MaxLoad/100.0 - 1.15)*row.Nennleistung);
            bbpList.redLv4 = Math.ceil((row.MaxLoad/100.0 - 1.25)*row.Nennleistung);
            

            let mapString = '[map=7,50.81,8.77] ' + ' [/map]';
            var mapBBcode = new MapBBCode({
                windowPath: './mapbbcode/',
                layers: 'RailwayMap',
                defaultPosition: [22, 11],
                viewWidth: 900,
                viewHeight: 450,
                fullViewHeight: 600,
                allowedHTML: 'span|i|h6|br|input|li|ul|p|b|div|label|button|table|thead|tbody|tr|th|td',
                fullFromStart: false,
                fullViewHeight: -1, 
                defaultZoom: 8
            });
            mapBBcode.show('railmap', mapString);
            document.getElementById("nav-mfb-tab").click();
        };

        function getLevel(load){
            if(load < 0.8){return {'Lv': 1, 'Col': "#0087B9"};}
            if(load < 1.08){return {'Lv': 2, 'Col': "#007841"};}
            if(load < 1.15){return {'Lv': 3, 'Col': "#FFAF00"};}
            if(load < 1.25){return {'Lv': 4, 'Col': "#FF5A64"};}
            if(load < 1.4){return {'Lv': 5, 'Col': "#F01414"};}
            if(load >= 1.4){return {'Lv': 6, 'Col': "#B20000"};}
        };

        $(document).ready(function () {
            $('#list').bind('change', handleDialog);
        });

        function handleDialog(event) {
            const { files } = event.target;
            const file = files[0];
            
            const reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = function (event) {                
                csv({
                    output: "json",
                    delimiter: ";"
                })
                .fromString(event.target.result)
                .then(function(result){
                    for (let i = 0; i < result.length; i+= 1) {
                        const dt = result[i].Datum; 
                        result[i].Datum = {'DText': dt, 'DNumber': luxon.DateTime.fromFormat(dt, 'dd.MM.yyyy').ts};
                        if(result[i].Verkehrsart === 'Alle'){
                            result[i]['Auslastung Fahrplan unter Bau'] = parseFloat(result[i]['Auslastung Fahrplan unter Bau'].replace(/,/g, '.'));
                            result[i]['Anzahl Züge Fahrplan'] = parseInt(result[i]['Anzahl Züge Fahrplan']);
                            result[i]['Nennleistung unter Bau'] = parseInt(result[i]['Nennleistung unter Bau']);
                        }                                                                   
                    }
                    bbpList.CapaList = result;
                    bbpList.loadComplete = true;
                    console.log(bbpList.CapaList.length);
                    console.log(bbpList.CapaList[6]);
                })
            }
        };                
    };

    function BbpService(){
        let service = this;
    };

})();