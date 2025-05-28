export interface Questionnaire {
    id: string;
    userId: string;
    dateCreation: Date;
    consommationDrogues: string[];
    frequenceConsommation: {
        [key: string]: string; // drogue -> fréquence
    };
    consommationAlcool: {
        frequence: string;
        quantite: number;
    };
    impactSante: string;
    impactSocial: string;
    demandeAide: boolean;
    commentaires?: string;
}
