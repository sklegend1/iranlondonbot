import { Scenes } from "telegraf";
import { Context } from "vm";

type MySession = Scenes.SceneSession & {
    wizardData?: Record<string, any>;
  };
  
export  type MyContext = Context & {
    session: MySession;
    scene: Scenes.SceneContextScene<any, any>;
    wizard: Scenes.WizardContextWizard<any>;
  };