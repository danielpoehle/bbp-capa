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
        bbpList.CapaList = [];

        bbpList.findOverload = function(){
            let constructionList = bbpList.CapaList.filter((c) => c.Baustelle !== '0');
            let trNumbers = constructionList.map((c) => c.Streckennummer);
            trNumbers = trNumbers.filter((item, index) => trNumbers.indexOf(item)===index);

            for (let i = 0; i < trNumbers.length; i+=1) {
                let list = constructionList.filter((c) => c.Streckennummer === trNumbers[i] && c.Verkehrsart === 'Alle');
                let maxLoad = Math.max.apply(null, list.map((c) => c['Auslastung Fahrplan unter Bau']));
                maxLoad = list.find((c) => c['Auslastung Fahrplan unter Bau'] === maxLoad);
                if(i < 4){console.log(maxLoad);} 
            }
        }

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
                    console.log(bbpList.CapaList[0]);
                })
            }
        };                
    };

    function BbpService(){
        let service = this;
    };

})();