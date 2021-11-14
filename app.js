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
                        'SGV': sgv['Anzahl Züge Fahrplan']
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
            bbpList.updateSelectedTrack(track, row.Date.DNumber);

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

        bbpList.updateSelectedTrack = function(track, date){
            bbpList.selectTrack = track;
            bbpList.selectedRoute = [];
            bbpList.fromBTS = {'id': -1, 'bts': ''};
            bbpList.toBTS = {'id': -1, 'bts': ''};
            let trackList = bbpList.CapaList.filter((c) => c.Streckennummer === track && c.Verkehrsart === 'Alle' && c.Datum.DNumber === date);
            let start = trackList.map((c) => c['Von Betriebsstelle']);
            let end = trackList.map((c) => c['Bis Betriebsstelle']);
            let firstBts = start.filter((x) => !end.includes(x))[0];
            for (let i = 0; i < trackList.length; i+=1) {
                const element = trackList.find((c) => c['Von Betriebsstelle'] === firstBts);
                firstBts = element['Bis Betriebsstelle'];
                if(element['Nennleistung unter Bau'] === 0){
                    bbpList.selectedRoute.push({
                        'id': i,
                        'section': element,
                        'level': element['Anzahl Züge Fahrplan']>0 ? {'Lv': 6, 'Col': "#B20000"} : {'Lv': 1, 'Col': "#0087B9"},
                        'MaxLoad': element['Anzahl Züge Fahrplan']>0 ? 999999 : 0 
                    });
                }else{
                    bbpList.selectedRoute.push({
                        'id': i,
                        'section': element,
                        'level': getLevel(element['Auslastung Fahrplan unter Bau']),
                        'MaxLoad': Math.round(100.0*element['Auslastung Fahrplan unter Bau'])
                    });
                    
                }
                
            }
        };

        bbpList.addSection = function(){
            if(bbpList.fromBTS.id === -1 || bbpList.toBTS.id === -1){return;}
            if(bbpList.fromBTS.id <= bbpList.toBTS.id){
                generateNormalOrder();
            }else{
                generateReversedOrder();
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

        function generateNormalOrder(){
            if(bbpList.toNewRoute){
                for (let i = bbpList.fromBTS.id; i <= bbpList.toBTS.id; i+=1) {
                    const element = bbpList.selectedRoute[i];                     

                    bbpList.newRoute.push({                        
                        'section': element.section,
                        'strecke': bbpList.selectTrack,
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

        function generateReversedOrder(){
            if(bbpList.toNewRoute){
                for (let i = bbpList.fromBTS.id; i >= bbpList.toBTS.id; i-=1) {
                    const element = bbpList.selectedRoute[i];                     

                    bbpList.newRoute.push({                        
                        'section': element.section,
                        'strecke': bbpList.selectTrack,
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
                'id': id,
                'bts': bbpList.selectedRoute.find((c) => c.id === id).section['Von Betriebsstelle']
            };
            switchBTS();            
        };

        bbpList.setEnd = function(id){
            bbpList.toBTS = {
                'id': id,
                'bts': bbpList.selectedRoute.find((c) => c.id === id).section['Bis Betriebsstelle']
            };
            switchBTS();             
        };

        function switchBTS(){
            if(bbpList.fromBTS.id === -1 || bbpList.toBTS.id === -1){return;}
            if(bbpList.fromBTS.id > bbpList.toBTS.id){
                bbpList.fromBTS.bts = bbpList.selectedRoute.find((c) => c.id === bbpList.fromBTS.id).section['Bis Betriebsstelle'];
                bbpList.toBTS.bts = bbpList.selectedRoute.find((c) => c.id === bbpList.toBTS.id).section['Von Betriebsstelle'];
            }
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