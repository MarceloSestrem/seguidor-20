//% color="#028A7F" weight=100 icon="\uf1b9" block="Robotbit PRO"
namespace robotbitPro {

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
        //% block="M1A"
        M1A = 1,
        //% block="M1B"
        M1B = 2,
        //% block="M2A"
        M2A = 3,
        //% block="M2B"
        M2B = 4
    }

    export enum ServoPorta {
        //% block="S1"
        S1 = 1,
        //% block="S2"
        S2 = 2,
        //% block="S3"
        S3 = 3,
        //% block="S4"
        S4 = 4
    }

    const PCA9685_ADDRESS = 0x40
    const SUBADR1 = 0x02
    const SUBADR2 = 0x03
    const SUBADR3 = 0x04
    const MODE1 = 0x00
    const PRESCALE = 0xFE
    const LED0_ON_L = 0x06

    let inicializado = false

    // Função interna para configurar os registradores I2C do chip da Robotbit
    function initPCA9685(): void {
        if (inicializado) return;

        let buf = pins.createBuffer(2);

        // Inicializa o chip em modo de configuração
        buf[0] = MODE1; buf[1] = 0x10;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);

        // Define a frequência para 50Hz (Padrão para servos de robótica)
        buf[0] = PRESCALE; buf[1] = 132; // 132 mapeia para ~50Hz
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);

        // Sai do modo de configuração e ativa as saídas PWM
        buf[0] = MODE1; buf[1] = 0x81;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);

        inicializado = true;
    }

    function writePWM(canal: number, valor: number): void {
        initPCA9685();
        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + (canal * 4);
        buf[1] = 0;
        buf[2] = 0;
        buf[3] = valor & 0xFF;
        buf[4] = (valor >> 8) & 0xFF;
        pins.i2cWriteBuffer(PCA9685_ADDRESS, buf);
    }

    /**
     * Controla a velocidade e direção dos motores DC (M1A, M1B, M2A, M2B) conectados à Robotbit.
     * @param motor Selecione a porta do motor
     * @param velocidade Velocidade variando de -255 (trás) a 255 (frente)
     */
    //% blockId=robotbit_controlar_motor
    //% block="mover motor %motor | velocidade %velocidade"
    //% velocidade.min=-255 velocidade.max=255
    //% weight=95
    export function controlarMotor(motor: MotorSelecao, velocidade: number): void {
        let canalM1 = 0;
        let canalM2 = 0;

        // Mapeamento interno dos canais do chip da Robotbit para as pontes H
        if (motor == MotorSelecao.M1A) { canalM1 = 2; canalM2 = 3; }
        else if (motor == MotorSelecao.M1B) { canalM1 = 4; canalM2 = 5; }
        else if (motor == MotorSelecao.M2A) { canalM1 = 6; canalM2 = 7; }
        else if (motor == MotorSelecao.M2B) { canalM1 = 8; canalM2 = 9; }

        let velMapeada = Math.map(Math.abs(velocidade), 0, 255, 0, 4095);

        if (velocidade >= 0) {
            writePWM(canalM1, velMapeada);
            writePWM(canalM2, 0);
        } else {
            writePWM(canalM1, 0);
            writePWM(canalM2, velMapeada);
        }
    }

    /**
     * Freia imediatamente um motor específico cortando sua energia.
     */
    //% blockId=robotbit_parar_motor
    //% block="parar motor %motor"
    //% weight=92
    export function pararMotor(motor: MotorSelecao): void {
        controlarMotor(motor, 0);
    }

    /**
     * Desliga e freia imediatamente TODOS os motores DC conectados à placa expansora.
     */
    //% blockId=robotbit_parar_todos_motores
    //% block="parar todos os motores"
    //% weight=90
    export function pararTodosOsMotores(): void {
        controlarMotor(MotorSelecao.M1A, 0);
        controlarMotor(MotorSelecao.M1B, 0);
        controlarMotor(MotorSelecao.M2A, 0);
        controlarMotor(MotorSelecao.M2B, 0);
    }
    /**
     * Controla o ângulo de um Servo Motor conectado diretamente às portas S1, S2, S3 ou S4 da Robotbit.
     * @param porta Porta do servo (S1 a S4)
     * @param angulo Ângulo desejado (0 a 180 graus)
     */
    //% blockId=robotbit_controlar_servo
    //% block="definir servo na porta %porta | para ângulo %angulo °"
    //% angulo.min=0 angulo.max=180
    //% weight=88
    export function controlarServo(porta: ServoPorta, angulo: number): void {
        // Na Robotbit os pinos de Servo físicos S1-S4 começam no canal 8 do chip I2C
        let canalChip = 7 + porta;
        // Converte o ângulo de 0-180 graus para pulsos PWM de 12 bits (aproximadamente 150 a 500)
        let pulso = Math.map(angulo, 0, 180, 150, 500);
        writePWM(canalChip, pulso);
    }

    /**
     * Verifica simultaneamente o estado dos 3 sensores de linha conectados em P0, P1 e P2.
     * Atenção: Remova o jumper do Buzzer da placa Robotbit se usar o sensor na porta P0.
     */
    //% blockId=robotbit_ler_tres_sensores
    //% block="sensores Esquerdo (P0) Centro (P1) Direito (P2) leem respectivamente %estEsq %estCent %estDir"
    //% weight=80
    //% inlineInputMode=inline
    export function lerTresSensores(
        estEsq: EstadoLinha, estCent: EstadoLinha, estDir: EstadoLinha
    ): boolean {
        let valEsq = pins.digitalReadPin(DigitalPin.P0);
        let valCent = pins.digitalReadPin(DigitalPin.P1);
        let valDir = pins.digitalReadPin(DigitalPin.P2);

        return (valEsq == estEsq && valCent == estCent && valDir == estDir);
    }

    /**
     * Mede a distância usando um sensor ultrassônico HC-SR04.
     */
    //% blockId=robotbit_ultrassonico_distancia
    //% block="distância ultrassônico Trig %trig | Echo %echo em %unidade"
    //% weight=75
    export function lerUltrassonico(trig: DigitalPin, echo: DigitalPin, unidade: DistanciaUnidade): number {
        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);

        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        let duracao = pins.pulseIn(echo, PulseValue.High, 25000);

        if (duracao == 0) {
            return 0;
        }

        if (unidade == DistanciaUnidade.Centimetros) {
            return Math.round(duracao / 58);
        } else {
            return Math.round(duracao / 148);
        }
    }
}
