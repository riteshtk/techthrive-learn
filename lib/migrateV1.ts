// Moves v1 progress into v2 once (PRD P17). v1 kept finished topics as
// {done: [ids]}; each is now a Foundations lesson with the same id. Run as
// an inline script in the page head, before anything reads progress, so
// it adds nothing to any page's JavaScript bundle (the budget). Lessons
// already in v2 are left as they are; corrupt v1 data is dropped.

export const V1_KEY = "ttl-learn:progress:v1";

/** Foundations lesson ids (v1 topic ids) and their step counts. */
const LESSONS = { "how-an-llm-answers": 7, rag: 7, "agent-loop": 7 };

/** The migration as plain JavaScript, called with (localStorage, now). */
export const MIGRATE_FN = `function(s,now){var v=s.getItem(${JSON.stringify(V1_KEY)});if(v===null)return;var L=${JSON.stringify(LESSONS)},d=[];try{d=JSON.parse(v).done}catch(e){}if(!Array.isArray(d))d=[];var ids=d.filter(function(i){return typeof i==="string"&&L.hasOwnProperty(i)});if(ids.length){var k="ttl-learn:progress:v2",c={};try{c=JSON.parse(s.getItem(k))||{}}catch(e){}if(typeof c!=="object"||Array.isArray(c))c={};var l=(c.lessons&&typeof c.lessons==="object")?c.lessons:{},at=now.toISOString();ids.forEach(function(i){var key="foundations/"+i;if(!l[key])l[key]={step:L[i],maxStep:L[i],startedAt:at,updatedAt:at,doneAt:at}});c.lessons=l;if(!c.checkpoints)c.checkpoints={};s.setItem(k,JSON.stringify(c))}s.removeItem(${JSON.stringify(V1_KEY)})}`;

/** The inline script: storage that throws keeps v1 progress for another
    visit. */
export const MIGRATE_SCRIPT = `try{(${MIGRATE_FN})(localStorage,new Date())}catch(e){}`;
