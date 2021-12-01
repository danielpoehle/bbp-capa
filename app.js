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
        bbpList.oldRoute = [];
        bbpList.newRoute = [];
        bbpList.selectedRoute = [];
        bbpList.selectTrack = '';
        bbpList.fromBTS = {'id': -1, 'bts': ''};;
        bbpList.toBTS = {'id': -1, 'bts': ''};;
        bbpList.toNewRoute = false;
        bbpList.maxSPFV = 0;
        bbpList.maxSPNV = 0;
        bbpList.maxSGV = 0;
        bbpList.remainSPFV = 0;
        bbpList.remainSPNV = 0;
        bbpList.remainSGV = 0;
        bbpList.newSPFV = 0;
        bbpList.newSPNV = 0;
        bbpList.newSGV = 0;
        bbpList.maxReroute = 0;
        bbpList.minReduce = 0;
        bbpList.savedRoutes = [];
        bbpList.appliedRouting = [];
        bbpList.activityList = [];
        bbpList.activityTrack = '';
        bbpList.activityStart = '';
        bbpList.activityStartTime = 0;
        bbpList.activityEnd = '';
        bbpList.activityEndTime = 24;
        bbpList.allDays = [];
        bbpList.activityNr = '';

        bbpList.findOverload = function(){
            bbpList.TrackAnalysis = [];
            let constructionList = bbpList.CapaList.filter((c) => c.Baustelle !== '0');
            let trNumbers = constructionList.map((c) => c.Streckennummer);
            trNumbers = trNumbers.filter((item, index) => trNumbers.indexOf(item)===index);

            for (let i = 0; i < trNumbers.length; i+=1) {
                let list = constructionList.filter((c) => c.Streckennummer === trNumbers[i] && c.Verkehrsart === 'Alle');
                if(Math.min(...list.map((c) => c['Nennleistung unter Bau']))=== 0){
                    let maxLoad = list.filter((c) => c['Nennleistung unter Bau'] === 0);
                    let days = maxLoad.map((c) => c.Datum.DNumber);
                    days = days.filter((item, index) => days.indexOf(item)===index);
                    days = days.length;
                    maxLoad = maxLoad[0];
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
                        'Days': days,
                        'From': maxLoad['Von Betriebsstelle'],
                        'To': maxLoad['Bis Betriebsstelle'],
                        'Nennleistung': maxLoad['Nennleistung unter Bau'],
                        'SPFV': spfv['Anzahl Züge Fahrplan'],
                        'SPNV': spnv['Anzahl Züge Fahrplan'],
                        'SGV': sgv['Anzahl Züge Fahrplan']
                    });
                }else{
                    let maxLoad = Math.max.apply(null, list.map((c) => c['Auslastung Fahrplan unter Bau']));
                    let threshold = getTresholdLevel(maxLoad);                    
                    let days = list.filter((c) => c['Auslastung Fahrplan unter Bau'] >= threshold);                     
                    days = days.map((c) => c.Datum.DNumber); 
                    days = days.filter((item, index) => days.indexOf(item)===index).length; 
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
                        'Days': days,
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
            let allDays = bbpList.CapaList.filter((c) => c['Von Betriebsstelle'] === bbpList.TrackAnalysis[0].From &&
                                                         c['Bis Betriebsstelle'] === bbpList.TrackAnalysis[0].To &&
                                                         c.Streckennummer === bbpList.TrackAnalysis[0].Strecke &&
                                                         c.Verkehrsart === 'Alle').map((c) => c.Datum.DNumber);
            allDays = allDays.filter((item, index) => allDays.indexOf(item)===index).sort();
            for (let index = 0; index < allDays.length; index+= 1) {
                bbpList.allDays.push({
                    'DNumber': allDays[index],
                    'DText': bbpList.CapaList.find((c) => c.Datum.DNumber === allDays[index]).Datum.DText
                });                
            }
            bbpList.activityStart = bbpList.CapaList.find((c) => c.Datum.DNumber === allDays[0]).Datum.DText;
            bbpList.activityEnd = bbpList.activityStart;
        };

        bbpList.showDetails = function(track, sw = true){
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
                    let maxLoad = list.filter((c) => c['Nennleistung unter Bau'] === 0);
                    let sections = maxLoad.map((c) => c['Von Betriebsstelle']);
                    sections = sections.filter((item, index) => sections.indexOf(item)===index);
                    sections = sections.length;
                    maxLoad = maxLoad[0];
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
                        'NumSec': sections,
                        'Level': maxLoad['Anzahl Züge Fahrplan']>0 ? {'Lv': 6, 'Col': "#B20000"} : {'Lv': 1, 'Col': "#0087B9"},
                        'From': maxLoad['Von Betriebsstelle'],
                        'To': maxLoad['Bis Betriebsstelle'],
                        'Nennleistung': maxLoad['Nennleistung unter Bau'],
                        'SPFV': spfv['Anzahl Züge Fahrplan'],
                        'SPNV': spnv['Anzahl Züge Fahrplan'],
                        'SGV': sgv['Anzahl Züge Fahrplan'],
                        'Bau': true
                    });
                }else{
                    let maxLoad = Math.max.apply(null, list.map((c) => c['Auslastung Fahrplan unter Bau']));
                    let threshold = getTresholdLevel(maxLoad);
                    let sections = list.filter((c) => c['Auslastung Fahrplan unter Bau'] >= threshold); 
                    sections = sections.map((c) => c['Von Betriebsstelle']);
                    sections = sections.filter((item, index) => sections.indexOf(item)===index).length;
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
                    
                    let bau = list.map((c) => c.Baustelle);                    
                    bbpList.LoadAnalysis.push({
                        'Date': maxLoad.Datum,
                        'MaxLoad': Math.round(100.0*maxLoad['Auslastung Fahrplan unter Bau']),
                        'NumSec': sections,
                        'Level': getLevel(maxLoad['Auslastung Fahrplan unter Bau']),
                        'From': maxLoad['Von Betriebsstelle'],
                        'To': maxLoad['Bis Betriebsstelle'],
                        'Nennleistung': maxLoad['Nennleistung unter Bau'],
                        'SPFV': spfv['Anzahl Züge Fahrplan'],
                        'SPNV': spnv['Anzahl Züge Fahrplan'],
                        'SGV': sgv['Anzahl Züge Fahrplan'],
                        'Bau': bau.some((c) => c !== '0')
                    });
                }
                
            }
            if(sw){
                console.log(bbpList.LoadAnalysis[0]);
                document.getElementById("nav-profile-tab").click();
            }
            
        };

        bbpList.editRouting =function(track, row){
            bbpList.EditRow = row;
            bbpList.showTrack = track;            
            bbpList.oldRoute = [];
            bbpList.newRoute = [];
            bbpList.maxSPFV = 0;
            bbpList.maxSPNV = 0;
            bbpList.maxSGV = 0;
            bbpList.remainSPFV = 0;
            bbpList.remainSPNV = 0;
            bbpList.remainSGV = 0;
            bbpList.newSPFV = 0;
            bbpList.newSPNV = 0;
            bbpList.newSGV = 0;
            bbpList.maxReroute = 0;
            bbpList.minReduce = 0;
            bbpList.updateSelectedTrack(track, row.Date.DText);

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

        bbpList.updateSelectedTrack = function(track, date, forRerouting = true){
            if(forRerouting){bbpList.selectTrack = track;}            
            bbpList.selectedRoute = [];
            bbpList.fromBTS = {'id': -1, 'bts': ''};
            bbpList.toBTS = {'id': -1, 'bts': ''};
            let trackList = bbpList.CapaList.filter((c) => c.Streckennummer === track && c.Verkehrsart === 'Alle' && c.Datum.DText === date);
            let start = trackList.map((c) => c['Von Betriebsstelle']);
            let end = trackList.map((c) => c['Bis Betriebsstelle']);
            let firstBts = start.filter((x) => !end.includes(x))[0];
            let mergedBTS = start.concat(end); 
            mergedBTS = mergedBTS.filter((item, index) => mergedBTS.indexOf(item) === index);
            let linkedTracks = bbpList.CapaList.filter((c) => c.Streckennummer !== track && c.Verkehrsart === 'Alle' && c.Datum.DText === date &&
                                                              (mergedBTS.includes(c['Von Betriebsstelle']) || mergedBTS.includes(c['Bis Betriebsstelle'])));
            
            for (let i = 0; i < trackList.length; i+=1) {
                const element = trackList.find((c) => c['Von Betriebsstelle'] === firstBts);
                let link = '';
                if(linkedTracks.find((c) => c['Von Betriebsstelle'] === element['Bis Betriebsstelle'] || 
                                            c['Bis Betriebsstelle'] === element['Bis Betriebsstelle']) !== undefined){
                    link = linkedTracks.filter((c) => c['Von Betriebsstelle'] === element['Bis Betriebsstelle'] || 
                                                      c['Bis Betriebsstelle'] === element['Bis Betriebsstelle']).map((c) => c.Streckennummer);
                    link = link.filter((item, index) => link.indexOf(item) === index).sort();
                }
                firstBts = element['Bis Betriebsstelle'];

                let spfv = {'Anzahl Züge Fahrplan': 0};
                let spnv = {'Anzahl Züge Fahrplan': 0};
                let sgv = {'Anzahl Züge Fahrplan': 0};

                if(!forRerouting){
                    spfv = bbpList.CapaList.find((c) => c.Streckennummer ===  element.Streckennummer && 
                                         c['Von Betriebsstelle'] === element['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === element['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === element.Datum.DNumber && c.Verkehrsart === 'SPFV');
                    spnv = bbpList.CapaList.find((c) => c.Streckennummer ===  element.Streckennummer && 
                                         c['Von Betriebsstelle'] === element['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === element['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === element.Datum.DNumber && c.Verkehrsart === 'SPNV');
                    sgv = bbpList.CapaList.find((c) => c.Streckennummer ===  element.Streckennummer && 
                                         c['Von Betriebsstelle'] === element['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === element['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === element.Datum.DNumber && c.Verkehrsart === 'SGV');
                }
                

                if(element['Nennleistung unter Bau'] === 0){
                    bbpList.selectedRoute.push({
                        'id': i,
                        'section': element,
                        'von': element['Von Betriebsstelle'],
                        'bis': element['Bis Betriebsstelle'],
                        'level': element['Anzahl Züge Fahrplan']>0 ? {'Lv': 6, 'Col': "#B20000"} : {'Lv': 1, 'Col': "#0087B9"},
                        'MaxLoad': element['Anzahl Züge Fahrplan']>0 ? 999999 : 0,
                        'Link': link,                        
                        'SPFV': spfv['Anzahl Züge Fahrplan'],
                        'SPNV': spnv['Anzahl Züge Fahrplan'],
                        'SGV': sgv['Anzahl Züge Fahrplan'] 
                    });
                }else{
                    bbpList.selectedRoute.push({
                        'id': i,
                        'section': element,                        
                        'von': element['Von Betriebsstelle'],
                        'bis': element['Bis Betriebsstelle'],
                        'level': getLevel(element['Auslastung Fahrplan unter Bau']),
                        'MaxLoad': Math.round(100.0*element['Auslastung Fahrplan unter Bau']),
                        'Link': link,
                        'SPFV': spfv['Anzahl Züge Fahrplan'],
                        'SPNV': spnv['Anzahl Züge Fahrplan'],
                        'SGV': sgv['Anzahl Züge Fahrplan']
                    });
                    
                }
                
            }
        };

        bbpList.reverseSection = function(track = bbpList.selectTrack, day = bbpList.EditRow.Date.DText){
            bbpList.fromBTS = {'id': -1, 'bts': ''};
            bbpList.toBTS = {'id': -1, 'bts': ''};
            let mergedBTS = bbpList.selectedRoute.map((c) => c.von).concat(bbpList.selectedRoute.map((c) => c.bis)); 
            mergedBTS = mergedBTS.filter((item, index) => mergedBTS.indexOf(item) === index);
            let linkedTracks = bbpList.CapaList.filter((c) => c.Streckennummer !== track && c.Verkehrsart === 'Alle' && c.Datum.DText === day &&
                                                              (mergedBTS.includes(c['Von Betriebsstelle']) || mergedBTS.includes(c['Bis Betriebsstelle'])));
            for (let i = 0; i < bbpList.selectedRoute.length; i+=1) {
                bbpList.selectedRoute[i].id = -1*bbpList.selectedRoute[i].id;
                let temp = bbpList.selectedRoute[i].von;
                bbpList.selectedRoute[i].von = bbpList.selectedRoute[i].bis;
                bbpList.selectedRoute[i].bis = temp;
                let link = '';
                if(linkedTracks.find((c) => c['Von Betriebsstelle'] === bbpList.selectedRoute[i].bis || 
                                            c['Bis Betriebsstelle'] === bbpList.selectedRoute[i].bis) !== undefined){
                    link = linkedTracks.filter((c) => c['Von Betriebsstelle'] === bbpList.selectedRoute[i].bis || 
                                                      c['Bis Betriebsstelle'] === bbpList.selectedRoute[i].bis).map((c) => c.Streckennummer);
                    link = link.filter((item, index) => link.indexOf(item) === index).sort();
                }
                bbpList.selectedRoute[i].Link = link;
            }
        };

        bbpList.addSection = function(activity = false){
            if(bbpList.fromBTS.id === -1 || bbpList.toBTS.id === -1){return;}
            if(bbpList.fromBTS.id <= bbpList.toBTS.id){
                generateNormalOrder(activity);
            }else{
                generateReversedOrder(activity);
            }            
            //reset selected BTS
            bbpList.fromBTS = {'id': -1, 'bts': ''};
            bbpList.toBTS = {'id': -1, 'bts': ''};
        };

        bbpList.deleteOldRoute = function(){
            bbpList.oldRoute = [];
            bbpList.newRoute = [];
            bbpList.maxSPFV = 0;
            bbpList.maxSPNV = 0;
            bbpList.maxSGV = 0;
            bbpList.remainSPFV = 0;
            bbpList.remainSPNV = 0;
            bbpList.remainSGV = 0;
            bbpList.newSPFV = 0;
            bbpList.newSPNV = 0;
            bbpList.newSGV = 0;
            bbpList.toNewRoute = false;
            bbpList.maxReroute = 0;
            bbpList.minReduce = 0;
        };

        bbpList.deleteNewRoute = function(){            
            bbpList.newRoute = [];
            bbpList.remainSPFV = bbpList.maxSPFV;
            bbpList.remainSPNV = bbpList.maxSPNV;
            bbpList.remainSGV = bbpList.maxSGV;
            bbpList.newSPFV = 0;
            bbpList.newSPNV = 0;
            bbpList.newSGV = 0;
            bbpList.toNewRoute = true;
            bbpList.maxReroute = 0;
        };

        function generateNormalOrder(activity){
            if(bbpList.toNewRoute || activity){
                for (let i = bbpList.fromBTS.id; i <= bbpList.toBTS.id; i+=1) {
                    const element = bbpList.selectedRoute[i];                     

                    bbpList.newRoute.push({                        
                        'section': element.section,
                        'strecke': activity? bbpList.activityTrack : bbpList.selectTrack,
                        'fromBTS': element.section['Von Betriebsstelle'],
                        'toBTS': element.section['Bis Betriebsstelle'],
                        'MaxLoad': element.MaxLoad,
                        'level': element.level,
                        'CapaToLv5': Math.floor(1.25*element.section['Nennleistung unter Bau'] - element.section['Anzahl Züge Fahrplan'])
                    }); 
                }
                bbpList.maxReroute = Math.min(...bbpList.newRoute.map((c) => c.CapaToLv5));
            }else{
                for (let i = bbpList.fromBTS.id; i <= bbpList.toBTS.id; i+=1) {
                    const element = bbpList.selectedRoute[i];

                    let spfv = bbpList.CapaList.find((c) => c.Streckennummer ===  bbpList.selectTrack && 
                                         c['Von Betriebsstelle'] === element.section['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === element.section['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === element.section.Datum.DNumber && c.Verkehrsart === 'SPFV');
                    let spnv = bbpList.CapaList.find((c) => c.Streckennummer ===  bbpList.selectTrack && 
                                         c['Von Betriebsstelle'] === element.section['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === element.section['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === element.section.Datum.DNumber && c.Verkehrsart === 'SPNV');
                    let sgv = bbpList.CapaList.find((c) => c.Streckennummer ===  bbpList.selectTrack && 
                                         c['Von Betriebsstelle'] === element.section['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === element.section['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === element.section.Datum.DNumber && c.Verkehrsart === 'SGV');
                    
                    bbpList.oldRoute.push({                        
                        'section': element.section,
                        'strecke': bbpList.selectTrack,
                        'fromBTS': element.section['Von Betriebsstelle'],
                        'toBTS': element.section['Bis Betriebsstelle'],
                        'MaxLoad': element.MaxLoad,
                        'level': element.level,
                        'SPFV': spfv['Anzahl Züge Fahrplan'],
                        'SPNV': spnv['Anzahl Züge Fahrplan'],
                        'SGV': sgv['Anzahl Züge Fahrplan'],
                        'ReductionToLv4': Math.ceil(element.section['Anzahl Züge Fahrplan'] - 1.24*element.section['Nennleistung unter Bau'])
                    });                    
                }
                //update traffic flows            
                bbpList.maxSPFV = Math.min(...bbpList.oldRoute.map((c) => c.SPFV));
                bbpList.maxSPNV = Math.min(...bbpList.oldRoute.map((c) => c.SPNV));
                bbpList.maxSGV = Math.min(...bbpList.oldRoute.map((c) => c.SGV));
                bbpList.remainSPFV = bbpList.maxSPFV;
                bbpList.remainSPNV = bbpList.maxSPNV;
                bbpList.remainSGV = bbpList.maxSGV;
                bbpList.minReduce = Math.max(...bbpList.oldRoute.map((c) => c.ReductionToLv4));
            }
        };

        function generateReversedOrder(activity){
            if(bbpList.toNewRoute || activity){
                for (let i = bbpList.fromBTS.id; i >= bbpList.toBTS.id; i-=1) {
                    const element = bbpList.selectedRoute[i];                     

                    bbpList.newRoute.push({                        
                        'section': element.section,
                        'strecke': activity? bbpList.activityTrack : bbpList.selectTrack,
                        'fromBTS': element.section['Bis Betriebsstelle'],
                        'toBTS': element.section['Von Betriebsstelle'],
                        'MaxLoad': element.MaxLoad,
                        'level': element.level,
                        'CapaToLv5': Math.floor(1.25*element.section['Nennleistung unter Bau'] - element.section['Anzahl Züge Fahrplan'])
                    }); 
                }
                bbpList.maxReroute = Math.min(...bbpList.newRoute.map((c) => c.CapaToLv5));
            }else{
                for (let i = bbpList.fromBTS.id; i >= bbpList.toBTS.id; i-=1) {
                    const element = bbpList.selectedRoute[i];

                    let spfv = bbpList.CapaList.find((c) => c.Streckennummer ===  bbpList.selectTrack && 
                                         c['Von Betriebsstelle'] === element.section['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === element.section['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === element.section.Datum.DNumber && c.Verkehrsart === 'SPFV');
                    let spnv = bbpList.CapaList.find((c) => c.Streckennummer ===  bbpList.selectTrack && 
                                         c['Von Betriebsstelle'] === element.section['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === element.section['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === element.section.Datum.DNumber && c.Verkehrsart === 'SPNV');
                    let sgv = bbpList.CapaList.find((c) => c.Streckennummer ===  bbpList.selectTrack && 
                                         c['Von Betriebsstelle'] === element.section['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === element.section['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === element.section.Datum.DNumber && c.Verkehrsart === 'SGV');
                    
                    bbpList.oldRoute.push({                        
                        'section': element.section,
                        'strecke': bbpList.selectTrack,
                        'fromBTS': element.section['Bis Betriebsstelle'],
                        'toBTS': element.section['Von Betriebsstelle'],
                        'MaxLoad': element.MaxLoad,
                        'level': element.level,
                        'SPFV': spfv['Anzahl Züge Fahrplan'],
                        'SPNV': spnv['Anzahl Züge Fahrplan'],
                        'SGV': sgv['Anzahl Züge Fahrplan'],
                        'ReductionToLv4': Math.ceil(element.section['Anzahl Züge Fahrplan'] - 1.25*element.section['Nennleistung unter Bau'])
                    });                    
                }
                //update traffic flows            
                bbpList.maxSPFV = Math.min(...bbpList.oldRoute.map((c) => c.SPFV));
                bbpList.maxSPNV = Math.min(...bbpList.oldRoute.map((c) => c.SPNV));
                bbpList.maxSGV = Math.min(...bbpList.oldRoute.map((c) => c.SGV));
                bbpList.remainSPFV = bbpList.maxSPFV;
                bbpList.remainSPNV = bbpList.maxSPNV;
                bbpList.remainSGV = bbpList.maxSGV;
                bbpList.minReduce = Math.max(...bbpList.oldRoute.map((c) => c.ReductionToLv4));
            }
        };

        bbpList.applyRouting = function(){ 
            let totalChange = bbpList.newSPFV + bbpList.newSPNV + bbpList.newSGV;
            for (let i = 0; i < bbpList.oldRoute.length; i+=1) {
                const element = bbpList.oldRoute[i].section;

                let list = bbpList.CapaList.filter((c) => c.Streckennummer ===  element.Streckennummer && 
                                         c['Von Betriebsstelle'] === element['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === element['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === element.Datum.DNumber);
                if(bbpList.newSPFV > 0){
                    list.find((c) => c.Verkehrsart === 'SPFV')['Anzahl Züge Fahrplan'] -= bbpList.newSPFV;
                }
                if(bbpList.newSPNV > 0){
                    list.find((c) => c.Verkehrsart === 'SPNV')['Anzahl Züge Fahrplan'] -= bbpList.newSPNV;
                }
                if(bbpList.newSGV > 0){
                    list.find((c) => c.Verkehrsart === 'SGV')['Anzahl Züge Fahrplan'] -= bbpList.newSGV;
                }
                let all = list.find((c) => c.Verkehrsart === 'Alle')
                all['Anzahl Züge Fahrplan'] -= totalChange;
                all['Auslastung Fahrplan unter Bau'] = Math.round((1.0 * all['Anzahl Züge Fahrplan'] / all['Nennleistung unter Bau'] + Number.EPSILON) * 100) / 100; 
            }
            
            for (let i = 0; i < bbpList.newRoute.length; i+=1) {
                const element = bbpList.newRoute[i].section;

                let list = bbpList.CapaList.filter((c) => c.Streckennummer ===  element.Streckennummer && 
                                         c['Von Betriebsstelle'] === element['Von Betriebsstelle'] &&
                                         c['Bis Betriebsstelle'] === element['Bis Betriebsstelle'] &&
                                         c.Datum.DNumber === element.Datum.DNumber);
                if(bbpList.newSPFV > 0){
                    list.find((c) => c.Verkehrsart === 'SPFV')['Anzahl Züge Fahrplan'] += bbpList.newSPFV;
                }
                if(bbpList.newSPNV > 0){
                    list.find((c) => c.Verkehrsart === 'SPNV')['Anzahl Züge Fahrplan'] += bbpList.newSPNV;
                }
                if(bbpList.newSGV > 0){
                    list.find((c) => c.Verkehrsart === 'SGV')['Anzahl Züge Fahrplan'] += bbpList.newSGV;
                }
                let all = list.find((c) => c.Verkehrsart === 'Alle')
                all['Anzahl Züge Fahrplan'] += totalChange;
                all['Auslastung Fahrplan unter Bau'] = Math.round((1.0 * all['Anzahl Züge Fahrplan'] / all['Nennleistung unter Bau'] + Number.EPSILON) * 100) / 100; 
            
                
            }

            bbpList.appliedRouting.push({
                'old': createRouteObject(false),
                'new': createRouteObject(),
                'spfv': bbpList.newSPFV,
                'spnv': bbpList.newSPNV,
                'sgv': bbpList.newSGV
            });

            bbpList.showDetails(bbpList.showTrack, false);
            bbpList.updateSelectedTrack(bbpList.showTrack, bbpList.EditRow.Date.DText);
            bbpList.deleteOldRoute();
        };

        bbpList.saveRoute = function(){            
            bbpList.savedRoutes.push(createRouteObject());
        };

        bbpList.RerouteSPFV = function(amount){
            bbpList.remainSPFV -= amount;
            bbpList.newSPFV += amount;
        };

        bbpList.ResetRerouteSPFV = function(){
            bbpList.remainSPFV += bbpList.newSPFV;
            bbpList.newSPFV = 0;
        };

        bbpList.RerouteSPNV = function(amount){
            bbpList.remainSPNV -= amount;
            bbpList.newSPNV += amount;
        };

        bbpList.ResetRerouteSPNV = function(){
            bbpList.remainSPNV += bbpList.newSPNV;
            bbpList.newSPNV = 0;
        };

        bbpList.RerouteSGV = function(amount){
            bbpList.remainSGV -= amount;
            bbpList.newSGV += amount;
        };

        bbpList.ResetRerouteSGV = function(){
            bbpList.remainSGV += bbpList.newSGV;
            bbpList.newSGV = 0;
        };

        bbpList.setStart = function(id){
            bbpList.fromBTS = {
                'id': id<0? -1*id: id,
                'bts': bbpList.selectedRoute.find((c) => c.id === id).von
            };
            //console.log(bbpList.fromBTS);           
        };

        bbpList.setEnd = function(id){
            bbpList.toBTS = {
                'id': id<0? -1*id: id,
                'bts': bbpList.selectedRoute.find((c) => c.id === id).bis
            };
            //console.log(bbpList.toBTS);            
        };    
        
        bbpList.getActivityRoute = function(){
            return (createRouteObject());
        };
        
        function createRouteObject(routeNew = true){   
            let route = routeNew? bbpList.newRoute: bbpList.oldRoute;
            if(route.length < 1){return({
                'from': '',
                'startTrack': '',
                'to': '',
                'endTrack': '',
                'way': '',
                'idList': ''
            });}      
            let idList = [route[0].section.ID];
            let wayString = route[0].fromBTS + ' - ' + route[0].strecke + ' - ';
            for (let i = 0; i < (route.length-1); i+=1) {
                idList.push(route[i+1].section.ID);
                if(route[i].strecke !== route[i+1].strecke){
                    let connection = [route[i].fromBTS, route[i].toBTS].filter(x => [route[i+1].fromBTS, route[i+1].toBTS].includes(x))[0];
                    wayString += connection + ' - ' + route[i+1].strecke + ' - ';
                }
            }
            let endBTS = route[route.length-1].toBTS;
            wayString += endBTS;
            return({
                'from': route[0].fromBTS,
                'startTrack': route[0].strecke,
                'to': endBTS,
                'endTrack': route[route.length-1].strecke,
                'way': wayString,
                'idList': idList
            });
        };

        function getLevel(load){
            if(load < 0.8){return {'Lv': 1, 'Col': "#0087B9"};}
            if(load < 1.08){return {'Lv': 2, 'Col': "#007841"};}
            if(load < 1.15){return {'Lv': 3, 'Col': "#FFAF00"};}
            if(load < 1.25){return {'Lv': 4, 'Col': "#FF5A64"};}
            if(load < 1.4){return {'Lv': 5, 'Col': "#F01414"};}
            if(load >= 1.4){return {'Lv': 6, 'Col': "#B20000"};}
        };

        function getTresholdLevel(load){
            if(load < 0.8){return 0.0;}
            if(load < 1.08){return 0.8;}
            if(load < 1.15){return 1.08;}
            if(load < 1.25){return 1.15;}
            if(load < 1.4){return 1.25;}
            if(load >= 1.4){return 1.4;}
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
                        result[i].ID = result[i].Streckennummer + '#' + result[i]['Von Betriebsstelle'] + '#' + result[i]['Bis Betriebsstelle'];
                        result[i]['Anzahl Züge Fahrplan'] = parseInt(result[i]['Anzahl Züge Fahrplan']);
                        if(result[i].Verkehrsart === 'Alle'){
                            result[i]['Auslastung Fahrplan unter Bau'] = parseFloat(result[i]['Auslastung Fahrplan unter Bau'].replace(/,/g, '.'));                            
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