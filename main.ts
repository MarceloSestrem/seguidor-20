//% color="#028A7F" weight=100 icon="\uf1b9" block="Robô Seguidor PRO"
namespace roboSeguidorPro {

    export enum EstadoLinha {
        //% block="Branco"
        Branco = 0,
        //% block="Preto"
        Preto = 1
    }

    export enum DistanciaUnidade {
        //% block="cm"
        Centimetros = 0,
        //% block="polegadas"
        Polegadas = 1
    }

    export enum MotorSelecao {
        //% block="M1 (Esquerdo)"
        M1 = 1,
        //% block="M2 (Direito)"
        M2 = 2
    }

    export enum MotorDirecao {
        //% block="Frente"
        Frente = 0,
        //% block="Trás"
        Tras = 1
    }

    /**
     * Controla os motores de redução M1 e M2 através da mini ponte H.
     * @param motor Selecione o motor M1 ou M2
     * @param direcao Sentido de rotação (Frente ou Trás)
     * @param velocidade Velocidade do motor de 0 a 255
     */
    //% blockId=robo_controlar_motor
    //% block="mover motor %motor | direção %direcao | velocidade %velocidade"
    //% velocidade.min=0 velocidade.max=255
    //% weight=95
    export function controlarMotor(motor: MotorSelecao, direcao: MotorDirecao, velocidade: number): void {
        let pinoDir = (motor == MotorSelecao.M1) ? DigitalPin.P8 : DigitalPin.P11;
        let pinoVel = (motor == MotorSelecao.M1) ? AnalogPin.P9 : AnalogPin.P10;

        pins.digitalWritePin(pinoDir, direcao);

        let valorPWM = Math.map(velocidade, 0, 255, 0, 1023);
        pins.analogWritePin(pinoVel, valorPWM);
    }

    /**
     * Para um motor específico cortando totalmente a energia dele.
     */
    //% blockId=robo_parar_motor
    //% block="parar motor %motor"
    //% weight=92
    export function pararMotor(motor: MotorSelecao): void {
        let pinoDir = (motor == MotorSelecao.M1) ? DigitalPin.P8 : DigitalPin.P11;
        let pinoVel = (motor == MotorSelecao.M1) ? AnalogPin.P9 : AnalogPin.P10;

        pins.digitalWritePin(pinoDir, 0);
        pins.analogWritePin(pinoVel, 0);
    }

    /**
     * Controla a posição de um Servo Motor conectado a um pino.
     * @param pino Pino onde o sinal do servo está conectado, ex: AnalogPin.P1
     * @param angulo Ângulo desejado para o servo (0 a 180 graus)
     */
    //% blockId=robo_controlar_servo
    //% block="definir servo no pino %pino | para ângulo %angulo °"
    //% angulo.min=0 angulo.max=180
    //% weight=88
    export function controlarServo(pino: AnalogPin, angulo: number): void {
        pins.servoWritePin(pino, angulo);
    }

    /**
     * Verifica simultaneamente o estado dos 3 sensores de linha digitais.
     */
    //% blockId=robo_ler_tres_sensores
    //% block="sensores Esquerdo %pinoEsq Centro %pinoCent Direito %pinoDir leem respectivamente %estEsq %estCent %estDir"
    //% weight=80
    //% inlineInputMode=inline
    export function lerTresSensores(
        pinoEsq: DigitalPin, pinoCent: DigitalPin, pinoDir: DigitalPin,
        estEsq: EstadoLinha, estCent: EstadoLinha, estDir: EstadoLinha
    ): boolean {
        let valEsq = pins.digitalReadPin(pinoEsq);
        let valCent = pins.digitalReadPin(pinoCent);
        let valDir = pins.digitalReadPin(pinoDir);

        return (valEsq == estEsq && valCent == estCent && valDir == estDir);
    }

    /**
     * Mede a distância usando um sensor ultrassônico HC-SR04.
     * Utiliza o controle nativo de microsegundos do micro:bit para evitar erros.
     */
    //% blockId=robo_ultrassonico_distancia
    //% block="distância ultrassônico Trig %trig | Echo %echo em %unidade"
    //% weight=75
    export function lerUltrassonico(trig: DigitalPin, echo: DigitalPin, unidade: DistanciaUnidade): number {
        // 1. Garante que o pino de disparo comece desligado
        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);

        // 2. Envia o pulso de Trigger de 10 microsegundos exatos para o HC-SR04
        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        // 3. Lê o tempo de retorno no pino Echo
        let duracao = pins.pulseIn(echo, PulseValue.High, 25000);

        if (duracao == 0) {
            return 0;
        }

        // 4. Calcula o retorno com base na velocidade do som
        if (unidade == DistanciaUnidade.Centimetros) {
            return Math.round(duracao / 58);
        } else {
            return Math.round(duracao / 148);
        }
    }
}
