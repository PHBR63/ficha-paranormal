import type { CharacterFormData } from '@/pages/CharacterCreate';
export function validCreation(classId='Combatente'):CharacterFormData {
  return {name:'Agente de teste',playerName:'',concept:'',age:null,gender:'',appearance:'',personality:'',photoUrl:null,photoFile:null,
    origin:'academico',characterClass:classId,nex:5,patent:'Recruta',attributes:{agility:2,strength:2,intellect:2,presence:2,vigor:1},
    originSkills:[],classSkillChoices:classId==='Combatente'?{combat:'luta',defense:'fortitude'}:{},
    freeSkills:classId==='Combatente'?['atletismo','vontade','percepcao']:classId==='Especialista'?['atletismo','vontade','percepcao','medicina','tecnologia','crime','reflexos','diplomacia','artes']:['atletismo','percepcao','medicina','tecnologia','crime'],
    conflictResolutions:{},skills:{},powers:[],background:'',proficiencies:[],abilities:[],classTrack:'',trackAbilities:[],rituals:[],
    originParanormalPower:null,skillTrainingChoices:{},transcenderChoices:{},classPowerChoices:classId==='Especialista'?{'perito-0':{powerId:'perito',choiceType:'skill',chosenValues:['medicina','tecnologia']}}:{},creationOperationId:'10000000-0000-4000-8000-000000000001'};
}
